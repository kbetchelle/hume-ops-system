import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Database,
  TableIcon,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Available tables for import (Arketa: reservations, subscriptions, payments only; Sling: shifts)
const AVAILABLE_TABLES = [
  { value: "arketa_reservations", label: "Arketa Reservations", uniqueKey: "reservation_id", csvUniqueKey: "reservation_id" },
  { value: "arketa_subscriptions", label: "Arketa Subscriptions", uniqueKey: "external_id", csvUniqueKey: "subscription_id" },
  { value: "arketa_payments", label: "Arketa Payments", uniqueKey: "external_id", csvUniqueKey: "payment_id" },
  { value: "staff_shifts", label: "Staff Shifts", uniqueKey: "sling_shift_id", csvUniqueKey: "shift_id" },
] as const;

interface FieldMapping {
  csvColumn: string;
  dbColumn: string;
  enabled: boolean;
  isNew: boolean; // True if this is a new field to add
  type: "text" | "number" | "boolean" | "date" | "json";
}

interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface RecordError {
  rowNumber: number;
  reason: string;
  record?: Record<string, unknown>;
}

interface ImportProgress {
  status: "idle" | "uploading" | "processing" | "complete" | "error";
  message: string;
  total: number;
  processed: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors?: string[];
  detailedErrors?: RecordError[];
}

export function CSVImportMapper() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog state
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"select-file" | "configure" | "importing" | "review" | "complete">("select-file");
  const [skippedRecordsData, setSkippedRecordsData] = useState<RecordError[]>([]);
  const [keepSkippedRecords, setKeepSkippedRecords] = useState(false);

  // File and parsing state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [csvContent, setCsvContent] = useState<string>("");

  // Table selection state
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [newTableName, setNewTableName] = useState<string>("");
  const [isCreatingNewTable, setIsCreatingNewTable] = useState(false);

  // Field mapping state
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [uniqueKeyColumn, setUniqueKeyColumn] = useState<string>(""); // Stores CSV column name
  const [overwriteExisting, setOverwriteExisting] = useState(true);

  // Import progress
  const [progress, setProgress] = useState<ImportProgress>({
    status: "idle",
    message: "",
    total: 0,
    processed: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
  });

  // Fetch table columns when a table is selected
  const { data: tableColumns, isLoading: isLoadingColumns } = useQuery({
    queryKey: ["table-columns", selectedTable],
    queryFn: async (): Promise<TableColumn[]> => {
      if (!selectedTable || isCreatingNewTable) return [];
      
      // Infer columns from a sample query
      // Dynamic table name requires bypassing type checking since table names
      // are determined at runtime, not compile time
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: sampleData, error: sampleError } = await (supabase as any)
        .from(selectedTable)
        .select("*")
        .limit(1);
      
      if (sampleError || !sampleData?.[0]) return [];
      
      return Object.keys(sampleData[0]).map(col => ({
        column_name: col,
        data_type: "text",
        is_nullable: "YES",
        column_default: null,
      }));
    },
    enabled: !!selectedTable && !isCreatingNewTable,
  });

  // Parse CSV file
  const parseCSV = useCallback((text: string) => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length === 0) return { headers: [], preview: [] };

    // Parse header
    const headers = parseCSVLine(lines[0]);

    // Parse preview rows (first 5 data rows)
    const preview: string[][] = [];
    for (let i = 1; i < Math.min(6, lines.length); i++) {
      preview.push(parseCSVLine(lines[i]));
    }

    return { headers, preview, totalRows: lines.length - 1 };
  }, []);

  // Parse a single CSV line (handles quoted fields)
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const text = await file.text();
    setCsvContent(text);

    const { headers, preview, totalRows } = parseCSV(text);
    setCsvHeaders(headers);
    setCsvPreview(preview);

    // Initialize field mappings from CSV headers
    const initialMappings: FieldMapping[] = headers.map((header) => ({
      csvColumn: header,
      dbColumn: normalizeColumnName(header),
      enabled: true,
      isNew: false,
      type: inferType(header, preview.map(row => row[headers.indexOf(header)])),
    }));
    setFieldMappings(initialMappings);

    setProgress((prev) => ({ ...prev, total: totalRows || 0 }));
    setStep("configure");
  };

  // Normalize column name for database
  const normalizeColumnName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
  };

  // Infer data type from sample values
  const inferType = (header: string, samples: string[]): FieldMapping["type"] => {
    const headerLower = header.toLowerCase();
    
    // Check header name hints
    if (headerLower.includes("email")) return "text";
    if (headerLower.includes("phone")) return "text";
    if (headerLower.includes("date") || headerLower.includes("_at") || headerLower.includes("time")) return "date";
    if (headerLower.includes("is_") || headerLower.includes("has_") || headerLower.includes("opt_in")) return "boolean";
    if (headerLower.includes("amount") || headerLower.includes("price") || headerLower.includes("count")) return "number";
    if (headerLower.includes("tags") || headerLower.includes("custom") || headerLower.includes("json")) return "json";

    // Check sample values
    const nonEmptySamples = samples.filter(s => s && s.trim());
    if (nonEmptySamples.length === 0) return "text";

    // Check if all samples are numbers
    if (nonEmptySamples.every(s => !isNaN(Number(s)))) return "number";
    
    // Check if all samples are booleans
    if (nonEmptySamples.every(s => ["true", "false", "1", "0", "yes", "no"].includes(s.toLowerCase()))) return "boolean";

    return "text";
  };

  // Update field mapping when table is selected
  const handleTableSelect = (tableName: string) => {
    if (tableName === "__new__") {
      setIsCreatingNewTable(true);
      setSelectedTable("");
      return;
    }

    setIsCreatingNewTable(false);
    setSelectedTable(tableName);

    // Auto-suggest unique key based on table config and available CSV columns
    const tableConfig = AVAILABLE_TABLES.find(t => t.value === tableName);
    if (tableConfig && tableConfig.csvUniqueKey) {
      // Check if the suggested CSV unique key column exists in the CSV headers
      const suggestedKey = csvHeaders.find(h => 
        normalizeColumnName(h) === normalizeColumnName(tableConfig.csvUniqueKey!)
      );
      if (suggestedKey) {
        setUniqueKeyColumn(suggestedKey);
      } else {
        setUniqueKeyColumn("");
      }
    } else {
      setUniqueKeyColumn("");
    }
  };

  // Auto-map CSV columns to table columns when table columns are loaded
  const autoMapColumns = useCallback(() => {
    if (!tableColumns || tableColumns.length === 0) return;

    const tableColumnNames = tableColumns.map((col) => col.column_name);
    const usedDbColumns = new Set<string>(); // Track which DB columns are already mapped

    setFieldMappings((prev) =>
      prev.map((mapping) => {
        // Try to find a matching table column
        const normalizedCsvCol = normalizeColumnName(mapping.csvColumn);
        
        // Priority 1: Exact match (case-insensitive)
        let matchingColumn = tableColumns.find(
          (col) => col.column_name.toLowerCase() === normalizedCsvCol.toLowerCase()
        );
        
        // Priority 2: Current dbColumn is valid and not used yet
        if (!matchingColumn && tableColumnNames.includes(mapping.dbColumn) && !usedDbColumns.has(mapping.dbColumn)) {
          matchingColumn = tableColumns.find((col) => col.column_name === mapping.dbColumn);
        }
        
        // Priority 3: Fuzzy match - but avoid partial matches that could cause collisions
        if (!matchingColumn) {
          matchingColumn = tableColumns.find((col) => {
            // Avoid fuzzy matching if it would cause collisions
            // e.g., "client_id" shouldn't match "id"
            const colName = col.column_name.toLowerCase();
            const csvName = normalizedCsvCol.toLowerCase();
            
            // Only match if one contains the other AND they're similar in length
            if (colName.includes(csvName) && csvName.length > 2 && csvName.length >= colName.length * 0.6) {
              return !usedDbColumns.has(col.column_name);
            }
            if (csvName.includes(colName) && colName.length > 2 && colName.length >= csvName.length * 0.6) {
              return !usedDbColumns.has(col.column_name);
            }
            return false;
          });
        }

        // Mark this DB column as used
        const selectedDbColumn = matchingColumn?.column_name || mapping.dbColumn;
        if (matchingColumn) {
          usedDbColumns.add(selectedDbColumn);
        }

        // If no match found, check if the current dbColumn exists in the table
        const dbColumnExists = tableColumnNames.includes(selectedDbColumn);

        return {
          ...mapping,
          dbColumn: selectedDbColumn,
          isNew: !matchingColumn && !dbColumnExists,
          // Auto-disable columns that don't exist in the table (for existing tables)
          enabled: matchingColumn || dbColumnExists ? mapping.enabled : false,
        };
      })
    );
  }, [tableColumns]);

  // Run auto-mapping when table columns load - use useEffect instead of useCallback
  useEffect(() => {
    if (tableColumns && tableColumns.length > 0) {
      autoMapColumns();
    }
  }, [tableColumns, autoMapColumns]);

  // Update a field mapping
  const updateMapping = (index: number, updates: Partial<FieldMapping>) => {
    setFieldMappings((prev) =>
      prev.map((mapping, i) => (i === index ? { ...mapping, ...updates } : mapping))
    );
  };

  // Toggle field enabled/disabled
  const toggleField = (index: number) => {
    updateMapping(index, { enabled: !fieldMappings[index].enabled });
  };

  // Chunk size for processing
  const CHUNK_SIZE = 500;

  // Import mutation with chunked processing
  const importMutation = useMutation({
    mutationFn: async () => {
      const targetTable = isCreatingNewTable ? newTableName : selectedTable;
      if (!targetTable) throw new Error("No table selected");
      if (!csvContent) throw new Error("No CSV content");
      if (!uniqueKeyColumn) throw new Error("No unique key column selected");

      // For existing tables, filter out "isNew" columns since they don't exist in the database
      const enabledMappings = fieldMappings.filter((m) => m.enabled && (!m.isNew || isCreatingNewTable));
      if (enabledMappings.length === 0) throw new Error("No fields selected for import");

      // Resolve the unique key CSV column to its database column name
      const uniqueKeyMapping = enabledMappings.find((m) => m.csvColumn === uniqueKeyColumn);
      if (!uniqueKeyMapping) {
        throw new Error(
          `Unique key CSV column "${uniqueKeyColumn}" is not found in enabled field mappings. Please ensure it's mapped and enabled.`
        );
      }
      
      // CRITICAL FIX: For predefined tables, ensure the unique key maps to the table's actual unique column
      let uniqueKeyDbColumn = uniqueKeyMapping.dbColumn;
      if (!isCreatingNewTable) {
        const tableConfig = AVAILABLE_TABLES.find(t => t.value === selectedTable);
        if (tableConfig && tableConfig.uniqueKey) {
          // Override the mapping to use the table's defined unique key column
          uniqueKeyDbColumn = tableConfig.uniqueKey;
          console.log(`Auto-mapping unique key: CSV "${uniqueKeyColumn}" -> DB "${uniqueKeyDbColumn}"`);
        }
      }

      // Parse CSV into lines for chunking
      const lines = csvContent.split("\n").filter((line) => line.trim());
      const headerLine = lines[0];
      const dataLines = lines.slice(1);
      const totalRows = dataLines.length;
      const totalChunks = Math.ceil(totalRows / CHUNK_SIZE);

      setStep("importing");
      setProgress({
        status: "processing",
        message: `Starting import of ${totalRows.toLocaleString()} records...`,
        total: totalRows,
        processed: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
      });

      // Aggregate results
      let totalInserted = 0;
      let totalUpdated = 0;
      let totalSkipped = 0;
      const allErrors: string[] = [];

      // Process in chunks
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const startIdx = chunkIndex * CHUNK_SIZE;
        const endIdx = Math.min(startIdx + CHUNK_SIZE, totalRows);
        const chunkLines = dataLines.slice(startIdx, endIdx);
        const chunkCsv = [headerLine, ...chunkLines].join("\n");
        const processedSoFar = endIdx;
        const percentComplete = Math.round((processedSoFar / totalRows) * 100);

        setProgress((prev) => ({
          ...prev,
          status: "processing",
          message: `Processing chunk ${chunkIndex + 1}/${totalChunks} (${percentComplete}%)...`,
          processed: startIdx,
        }));

        try {
          // CRITICAL: Ensure the unique key CSV column is mapped to the correct DB column
          const mappingsToSend = enabledMappings.map((m) => {
            // If this is the unique key CSV column and we have a table config, use the table's unique key
            if (m.csvColumn === uniqueKeyColumn && !isCreatingNewTable) {
              const tableConfig = AVAILABLE_TABLES.find(t => t.value === selectedTable);
              if (tableConfig && tableConfig.uniqueKey) {
                return {
                  csvColumn: m.csvColumn,
                  dbColumn: tableConfig.uniqueKey, // Use table's actual unique key column
                  type: m.type,
                };
              }
            }
            return {
              csvColumn: m.csvColumn,
              dbColumn: m.dbColumn,
              type: m.type,
            };
          });

          const { data, error } = await supabase.functions.invoke("import-csv-mapped", {
            body: {
              csvContent: chunkCsv,
              targetTable,
              fieldMappings: mappingsToSend,
              uniqueKeyColumn: uniqueKeyDbColumn, // Send resolved database column name
              createTable: isCreatingNewTable && chunkIndex === 0, // Only create on first chunk
              overwriteExisting, // Allow user to control if existing records are updated
            },
          });

          if (error) {
            allErrors.push(`Chunk ${chunkIndex + 1}: ${error.message}`);
            continue;
          }

          totalInserted += data?.inserted || 0;
          totalUpdated += data?.updated || 0;
          totalSkipped += data?.skipped || 0;

          // Collect detailed errors
          if (data?.detailedErrors && data.detailedErrors.length > 0) {
            setProgress((prev) => ({
              ...prev,
              detailedErrors: [...(prev.detailedErrors || []), ...data.detailedErrors],
            }));
          }

          if (data?.errors) {
            allErrors.push(...data.errors.slice(0, 5)); // Limit errors per chunk
          }

          // Update progress after each chunk
          setProgress((prev) => ({
            ...prev,
            processed: processedSoFar,
            inserted: totalInserted,
            updated: totalUpdated,
            skipped: totalSkipped,
            message: `Processed ${processedSoFar.toLocaleString()}/${totalRows.toLocaleString()} records (${percentComplete}%)`,
          }));
        } catch (err) {
          allErrors.push(`Chunk ${chunkIndex + 1}: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
      }

      return {
        success: allErrors.length === 0,
        total: totalRows,
        inserted: totalInserted,
        updated: totalUpdated,
        skipped: totalSkipped,
        errors: allErrors,
      };
    },
    onSuccess: (data) => {
      // Use functional update to preserve detailedErrors collected during import
      setProgress((prev) => {
        const newProgress: ImportProgress = {
          ...prev, // Preserve detailedErrors from previous state
          status: "complete" as const,
          message: "Import complete!",
          total: data.total,
          processed: data.total,
          inserted: data.inserted,
          updated: data.updated,
          skipped: data.skipped,
        };
        
        // If there are skipped records, go to review step, otherwise complete
        if (data.skipped > 0 && prev.detailedErrors && prev.detailedErrors.length > 0) {
          setSkippedRecordsData(prev.detailedErrors);
          setStep("review");
        } else {
          setStep("complete");
        }
        
        return newProgress;
      });
      
      queryClient.invalidateQueries();
      toast({
        title: data.skipped > 0 ? "Import Complete (with skips)" : "Import Complete",
        description: `${data.inserted.toLocaleString()} inserted, ${data.updated.toLocaleString()} updated${data.skipped > 0 ? `, ${data.skipped.toLocaleString()} skipped` : ""}`,
      });
    },
    onError: (error) => {
      setProgress((prev) => ({
        ...prev,
        status: "error",
        message: error instanceof Error ? error.message : "Import failed",
      }));
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  // Force import skipped records mutation
  const forceImportMutation = useMutation({
    mutationFn: async () => {
      const targetTable = isCreatingNewTable ? newTableName : selectedTable;
      if (!targetTable) throw new Error("No table selected");
      if (skippedRecordsData.length === 0) throw new Error("No skipped records to import");

      // Extract the records from skipped data
      const records = skippedRecordsData
        .filter((err) => err.record)
        .map((err) => err.record!);

      if (records.length === 0) {
        throw new Error("No valid record data found in skipped records");
      }

      // Attempt to insert all skipped records without validation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase
        .from(targetTable as any)
        .insert(records)
        .select());

      if (error) {
        console.error("Force import error:", error);
        throw new Error(`Force import failed: ${error.message}`);
      }

      return {
        success: true,
        inserted: data?.length || 0,
        failed: records.length - (data?.length || 0),
      };
    },
    onSuccess: (data) => {
      setProgress((prev) => ({
        ...prev,
        inserted: prev.inserted + data.inserted,
        skipped: Math.max(0, prev.skipped - data.inserted),
      }));
      toast({
        title: "Force Import Complete",
        description: `${data.inserted} records imported, ${data.failed} failed due to database constraints`,
      });
      setStep("complete");
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast({
        title: "Force Import Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  // Reset dialog state
  const resetDialog = () => {
    setStep("select-file");
    setSelectedFile(null);
    setCsvHeaders([]);
    setCsvPreview([]);
    setCsvContent("");
    setSelectedTable("");
    setNewTableName("");
    setIsCreatingNewTable(false);
    setFieldMappings([]);
    setUniqueKeyColumn("");
    setSkippedRecordsData([]);
    setKeepSkippedRecords(false);
    setProgress({
      status: "idle",
      message: "",
      total: 0,
      processed: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetDialog();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Import CSV with Mapping
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-5xl max-h-[95vh] h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            CSV Import Tool
          </DialogTitle>
          <DialogDescription>
            {step === "select-file" && "Select a CSV file to import"}
            {step === "configure" && "Configure table and field mappings"}
            {step === "importing" && "Importing data..."}
            {step === "complete" && "Import complete!"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Step 1: Select File */}
          {step === "select-file" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col gap-2 h-auto py-6"
                >
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <span className="text-lg font-medium">Select CSV File</span>
                  <span className="text-sm text-muted-foreground">
                    Click to browse or drag and drop
                  </span>
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Configure Mapping */}
          {step === "configure" && (
            <ScrollArea className="h-full w-full">
              <div className="flex flex-col space-y-6 pr-4 pb-4">
              {/* File info */}
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg flex-shrink-0">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{selectedFile?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {csvHeaders.length} columns, {progress.total} rows
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    resetDialog();
                  }}
                >
                  Change file
                </Button>
              </div>

              {/* Table Selection */}
              <div className="space-y-2 flex-shrink-0">
                <Label>Target Table</Label>
                <div className="flex gap-2">
                  <Select value={isCreatingNewTable ? "__new__" : selectedTable} onValueChange={handleTableSelect}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a table..." />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_TABLES.map((table) => (
                        <SelectItem key={table.value} value={table.value}>
                          <span className="flex items-center gap-2">
                            <TableIcon className="h-3 w-3" />
                            {table.label}
                          </span>
                        </SelectItem>
                      ))}
                      <SelectItem value="__new__">
                        <span className="flex items-center gap-2 text-primary">
                          <Plus className="h-3 w-3" />
                          Create new table...
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {isCreatingNewTable && (
                    <Input
                      placeholder="new_table_name"
                      value={newTableName}
                      onChange={(e) => setNewTableName(normalizeColumnName(e.target.value))}
                      className="flex-1"
                    />
                  )}
                </div>
              </div>

              {/* Unique Key Selection */}
              {(selectedTable || newTableName) && (
                <div className="space-y-2 flex-shrink-0">
                  <Label>Unique Key Column (for upsert)</Label>
                  <Select value={uniqueKeyColumn} onValueChange={setUniqueKeyColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select CSV column to use as unique key..." />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldMappings
                        .filter((m) => m.enabled)
                        .map((mapping) => (
                          <SelectItem key={mapping.csvColumn} value={mapping.csvColumn}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{mapping.csvColumn}</span>
                              {mapping.csvColumn !== mapping.dbColumn && (
                                <span className="text-xs text-muted-foreground">→ maps to: {mapping.dbColumn}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose the CSV column that uniquely identifies each record (e.g., subscription_id, client_id)
                  </p>
                </div>
              )}

              {/* Overwrite Existing Records Option */}
              {(selectedTable || newTableName) && uniqueKeyColumn && (
                <div className="flex items-center space-x-2 flex-shrink-0 p-3 bg-muted/30 rounded-lg">
                  <Checkbox
                    id="overwrite"
                    checked={overwriteExisting}
                    onCheckedChange={(checked) => setOverwriteExisting(checked as boolean)}
                  />
                  <div className="flex flex-col">
                    <Label htmlFor="overwrite" className="cursor-pointer font-medium">
                      Overwrite existing records
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {overwriteExisting
                        ? "Will update existing records with matching unique keys"
                        : "Will only insert new records, skip existing ones"}
                    </p>
                  </div>
                </div>
              )}

              {/* Important note about unique key */}
              {uniqueKeyColumn && (
                <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100">Unique Key Mapping</p>
                    <ul className="text-muted-foreground space-y-1 mt-1 text-xs list-disc list-inside">
                      <li>Your CSV column <span className="font-mono bg-blue-500/10 px-1 rounded">{uniqueKeyColumn}</span> will be used for deduplication</li>
                      {!isCreatingNewTable && AVAILABLE_TABLES.find(t => t.value === selectedTable) && (
                        <li>It will automatically map to the <span className="font-mono bg-blue-500/10 px-1 rounded">{AVAILABLE_TABLES.find(t => t.value === selectedTable)?.uniqueKey}</span> column in the database</li>
                      )}
                      <li>Every row must have a value in this column (empty values will be skipped)</li>
                      <li>Duplicate values will trigger updates (if overwrite is enabled) or be skipped</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Warning for unmapped columns */}
              {(selectedTable || newTableName) && !isCreatingNewTable && fieldMappings.some(m => m.isNew && m.enabled) && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">Some columns don't exist in the target table</p>
                    <p className="text-muted-foreground">
                      Columns marked as "New" will cause import errors. Either disable them or add them to the database first.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Missing: {fieldMappings.filter(m => m.isNew && m.enabled).map(m => m.dbColumn).join(", ")}
                    </p>
                  </div>
                </div>
              )}

              {/* Field Mappings */}
              {(selectedTable || newTableName) && (
                <div className="space-y-2 flex-shrink-0">
                  <Label className="flex items-center justify-between">
                    <span>Field Mappings ({fieldMappings.length} fields)</span>
                    <div className="flex gap-3 text-xs text-muted-foreground font-normal">
                      <span>{fieldMappings.filter(m => m.enabled).length} enabled</span>
                      {!isCreatingNewTable && fieldMappings.some(m => m.isNew) && (
                        <span className="text-destructive">
                          {fieldMappings.filter(m => m.isNew && m.enabled).length} will fail
                        </span>
                      )}
                    </div>
                  </Label>
                  <div className="border rounded-lg overflow-hidden">
                    <ScrollArea className="h-[300px] w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12 sticky top-0 bg-muted z-10">Use</TableHead>
                            <TableHead className="min-w-[150px] sticky top-0 bg-muted z-10">CSV Column</TableHead>
                            <TableHead className="w-8 sticky top-0 bg-muted z-10"></TableHead>
                            <TableHead className="min-w-[180px] sticky top-0 bg-muted z-10">Database Column</TableHead>
                            <TableHead className="w-24 sticky top-0 bg-muted z-10">Type</TableHead>
                            <TableHead className="w-20 sticky top-0 bg-muted z-10">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fieldMappings.map((mapping, index) => {
                            const isUniqueKey = mapping.csvColumn === uniqueKeyColumn;
                            const actualDbColumn = isUniqueKey && !isCreatingNewTable && AVAILABLE_TABLES.find(t => t.value === selectedTable)
                              ? AVAILABLE_TABLES.find(t => t.value === selectedTable)?.uniqueKey
                              : mapping.dbColumn;
                            
                            return (
                            <TableRow
                              key={index}
                              className={cn(
                                !mapping.enabled && "opacity-50",
                                isUniqueKey && "bg-blue-500/5 border-l-2 border-l-blue-500"
                              )}
                            >
                              <TableCell className="w-12">
                                <Checkbox
                                  checked={mapping.enabled}
                                  onCheckedChange={() => toggleField(index)}
                                />
                              </TableCell>
                              <TableCell className="font-mono text-sm min-w-[150px]">
                                <div className="flex items-center gap-2">
                                  {mapping.csvColumn}
                                  {isUniqueKey && (
                                    <Badge variant="default" className="text-[9px] px-1 py-0">
                                      UNIQUE KEY
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="w-8">
                                <ArrowRight className={cn("h-4 w-4", isUniqueKey ? "text-blue-600" : "text-muted-foreground")} />
                              </TableCell>
                              <TableCell className="min-w-[180px]">
                                {isUniqueKey && !isCreatingNewTable && actualDbColumn !== mapping.dbColumn ? (
                                  <div className="flex flex-col gap-1">
                                    <div className="font-mono text-sm text-blue-600 font-medium">
                                      {actualDbColumn}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                      Auto-mapped to table's unique key
                                    </div>
                                  </div>
                                ) : (
                                  <Input
                                    value={mapping.dbColumn}
                                    onChange={(e) =>
                                      updateMapping(index, {
                                        dbColumn: normalizeColumnName(e.target.value),
                                      })
                                    }
                                    className="h-8 font-mono text-sm w-full"
                                    disabled={!mapping.enabled}
                                  />
                                )}
                              </TableCell>
                              <TableCell className="w-24">
                                <Select
                                  value={mapping.type}
                                  onValueChange={(value) =>
                                    updateMapping(index, { type: value as FieldMapping["type"] })
                                  }
                                  disabled={!mapping.enabled}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="number">Number</SelectItem>
                                    <SelectItem value="boolean">Boolean</SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                    <SelectItem value="json">JSON</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="w-20">
                                {mapping.isNew && !isCreatingNewTable ? (
                                  <Badge variant="outline" className="text-xs bg-primary/10">
                                    <Plus className="h-3 w-3 mr-1" />
                                    New
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Mapped
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          )})}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </div>
              )}

              {/* Visual separator */}
              {csvPreview.length > 0 && fieldMappings.length > 0 && (
                <div className="border-t my-6"></div>
              )}

              {/* Preview - Shows mapped database column names */}
              {csvPreview.length > 0 && (
                <details open className="space-y-2 flex-shrink-0">
                  <summary className="text-xs font-medium cursor-pointer hover:text-foreground flex items-center gap-2">
                    <FileSpreadsheet className="h-3 w-3" />
                    Preview (first 5 rows) - Showing mapped field names
                  </summary>
                  <div className="border rounded-lg overflow-hidden">
                    <ScrollArea className="h-[200px] w-full">
                      <div className="min-w-max">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs font-semibold bg-muted sticky left-0 z-10">
                                Row
                              </TableHead>
                              {csvHeaders.map((csvHeader, i) => {
                                // Find the mapping for this CSV column
                                const mapping = fieldMappings.find(m => m.csvColumn === csvHeader && m.enabled);
                                const displayName = mapping ? mapping.dbColumn : csvHeader;
                                const isUnique = csvHeader === uniqueKeyColumn; // Compare CSV column name
                                
                                return (
                                  <TableHead 
                                    key={i} 
                                    className={cn(
                                      "text-xs font-semibold bg-muted whitespace-nowrap min-w-[120px]",
                                      isUnique && "bg-primary/10 text-primary"
                                    )}
                                    title={mapping ? `CSV: ${csvHeader} → DB: ${displayName}` : csvHeader}
                                  >
                                    <div className="flex flex-col gap-0.5">
                                      <span>{displayName}</span>
                                      {isUnique && (
                                        <span className="text-[9px] font-normal text-primary">UNIQUE KEY</span>
                                      )}
                                      {mapping && csvHeader !== displayName && (
                                        <span className="text-[9px] font-normal text-muted-foreground">from: {csvHeader}</span>
                                      )}
                                    </div>
                                  </TableHead>
                                );
                              })}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {csvPreview.map((row, rowIndex) => (
                              <TableRow key={rowIndex}>
                                <TableCell className="text-xs font-mono text-muted-foreground bg-muted/50 sticky left-0 z-10">
                                  {rowIndex + 1}
                                </TableCell>
                                {row.map((cell, cellIndex) => {
                                  const csvHeader = csvHeaders[cellIndex];
                                  const mapping = fieldMappings.find(m => m.csvColumn === csvHeader && m.enabled);
                                  const isUnique = csvHeader === uniqueKeyColumn; // Compare CSV column name
                                  
                                  return (
                                    <TableCell 
                                      key={cellIndex} 
                                      className={cn(
                                        "text-xs min-w-[120px]",
                                        isUnique && "bg-primary/5 font-medium"
                                      )}
                                    >
                                      <div className="max-w-[200px] truncate" title={cell}>
                                        {cell}
                                      </div>
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                </details>
              )}
              </div>
            </ScrollArea>
          )}

          {/* Step 3: Importing */}
          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="relative">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium text-lg">{progress.message}</p>
                <p className="text-sm text-muted-foreground">
                  {progress.processed > 0 && `${progress.processed.toLocaleString()} / ${progress.total.toLocaleString()} records`}
                </p>
                <div className="flex gap-3 justify-center pt-2">
                  {progress.inserted > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <Plus className="h-3 w-3 mr-1" />
                      {progress.inserted} inserted
                    </Badge>
                  )}
                  {progress.updated > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      {progress.updated} updated
                    </Badge>
                  )}
                  {progress.skipped > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {progress.skipped} skipped
                    </Badge>
                  )}
                </div>
              </div>

              {/* Show errors as they accumulate during import */}
              {progress.detailedErrors && progress.detailedErrors.length > 0 && (
                <div className="w-full max-w-2xl mt-6 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Errors detected ({progress.detailedErrors.length} records skipped)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Details will be available after import completes
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review Skipped Records */}
          {step === "review" && (
            <ScrollArea className="h-full w-full">
              <div className="flex flex-col py-6 space-y-6 pr-4">
                <div className="text-center space-y-2">
                  <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
                  <h3 className="text-lg font-semibold">Review Skipped Records</h3>
                  <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                    {progress.skipped} records were skipped during import. Review the errors below and decide whether to keep these records anyway or discard them.
                  </p>
                </div>

                {/* Import Summary */}
                <div className="flex gap-4 justify-center flex-wrap">
                  <Badge variant="outline" className="text-sm px-3 py-1.5">
                    <Plus className="h-3 w-3 mr-1" />
                    {progress.inserted} inserted
                  </Badge>
                  <Badge variant="outline" className="text-sm px-3 py-1.5">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    {progress.updated} updated
                  </Badge>
                  <Badge variant="destructive" className="text-sm px-3 py-1.5">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {progress.skipped} skipped
                  </Badge>
                </div>

                {/* Manual Override Option */}
                <div className="max-w-2xl mx-auto w-full space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="keep-skipped"
                        checked={keepSkippedRecords}
                        onCheckedChange={(checked) => setKeepSkippedRecords(checked as boolean)}
                      />
                      <div className="flex-1 space-y-1">
                        <Label htmlFor="keep-skipped" className="cursor-pointer font-medium text-base">
                          Force import skipped records anyway
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          This will attempt to insert all skipped records into the target table, ignoring validation errors. 
                          Records may still fail if they violate database constraints (e.g., unique key conflicts, missing required fields).
                        </p>
                      </div>
                    </div>
                    {keepSkippedRecords && (
                      <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded">
                        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-900 dark:text-amber-100">
                          <strong>Warning:</strong> Forcing import may result in incomplete or invalid data in your database. 
                          It's recommended to fix the source CSV and re-import instead.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Skipped Records Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Skipped Records ({skippedRecordsData.length})</Label>
                      <Badge variant="outline" className="text-xs">
                        Showing first {Math.min(100, skippedRecordsData.length)} records
                      </Badge>
                    </div>
                    <ScrollArea className="h-[400px] w-full border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-20 sticky top-0 bg-muted z-10">Row #</TableHead>
                            <TableHead className="sticky top-0 bg-muted z-10">Error Reason</TableHead>
                            <TableHead className="w-24 sticky top-0 bg-muted z-10">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {skippedRecordsData.map((error, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-mono text-xs">{error.rowNumber}</TableCell>
                              <TableCell className="text-sm">
                                <div className="space-y-1">
                                  <p className="text-destructive">{error.reason}</p>
                                  {error.record && (
                                    <details className="text-xs">
                                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                        View record data
                                      </summary>
                                      <pre className="mt-2 p-2 bg-background rounded text-xs overflow-x-auto max-h-40">
                                        {JSON.stringify(error.record, null, 2)}
                                      </pre>
                                    </details>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={keepSkippedRecords ? "default" : "secondary"} className="text-xs">
                                  {keepSkippedRecords ? "Will retry" : "Skipped"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          {/* Step 5: Complete */}
          {step === "complete" && (
            <ScrollArea className="h-full w-full">
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Import Complete!</p>
                <p className="text-sm text-muted-foreground">
                  Successfully processed {progress.total.toLocaleString()} records
                </p>
              </div>
              <div className="flex gap-4 flex-wrap justify-center">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  <Plus className="h-3 w-3 mr-1" />
                  {progress.inserted} inserted
                </Badge>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {progress.updated} updated
                </Badge>
                {progress.skipped > 0 && (
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {progress.skipped} skipped
                  </Badge>
                )}
              </div>

              {/* Detailed Errors Section */}
              {progress.detailedErrors && progress.detailedErrors.length > 0 && (
                <div className="w-full mt-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span>Skipped Records Details ({progress.detailedErrors.length} records)</span>
                  </div>
                  <ScrollArea className="h-[300px] w-full border rounded-md">
                    <div className="p-4 space-y-2">
                      {progress.detailedErrors.map((error, idx) => (
                        <div key={idx} className="p-3 bg-muted/50 rounded border-l-2 border-amber-500 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono text-muted-foreground">Row {error.rowNumber}</span>
                            <Badge variant="outline" className="text-xs">Skipped</Badge>
                          </div>
                          <p className="text-sm">{error.reason}</p>
                          {error.record && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                View record data
                              </summary>
                              <pre className="mt-2 p-2 bg-background rounded text-xs overflow-x-auto">
                                {JSON.stringify(error.record, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          {step === "configure" && (
            <>
              <Button variant="outline" onClick={() => setStep("select-file")}>
                Back
              </Button>
              <Button
                onClick={() => importMutation.mutate()}
                disabled={
                  (!selectedTable && !newTableName) ||
                  !uniqueKeyColumn ||
                  fieldMappings.filter((m) => m.enabled).length === 0 ||
                  importMutation.isPending
                }
              >
                {importMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Import {progress.total.toLocaleString()} Records
              </Button>
            </>
          )}
          {step === "review" && (
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  setKeepSkippedRecords(false);
                  setStep("complete");
                }}
                disabled={forceImportMutation.isPending}
              >
                Discard Skipped Records
              </Button>
              <Button 
                onClick={() => {
                  if (keepSkippedRecords) {
                    forceImportMutation.mutate();
                  } else {
                    setStep("complete");
                  }
                }}
                disabled={forceImportMutation.isPending}
              >
                {forceImportMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Force Importing...
                  </>
                ) : keepSkippedRecords ? (
                  "Force Import Skipped Records"
                ) : (
                  "Continue"
                )}
              </Button>
            </>
          )}
          {step === "complete" && (
            <Button onClick={() => handleOpenChange(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
