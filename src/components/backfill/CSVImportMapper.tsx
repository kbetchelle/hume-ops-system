import { useState, useRef, useCallback } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

// Available tables for import
const AVAILABLE_TABLES = [
  { value: "arketa_clients", label: "Arketa Clients", uniqueKey: "external_id" },
  { value: "arketa_classes", label: "Arketa Classes", uniqueKey: "external_id" },
  { value: "arketa_reservations", label: "Arketa Reservations", uniqueKey: "external_id" },
  { value: "arketa_payments", label: "Arketa Payments", uniqueKey: "external_id" },
  { value: "arketa_instructors", label: "Arketa Instructors", uniqueKey: "external_id" },
  { value: "staff_shifts", label: "Staff Shifts", uniqueKey: "sling_shift_id" },
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

interface ImportProgress {
  status: "idle" | "uploading" | "processing" | "complete" | "error";
  message: string;
  total: number;
  processed: number;
  inserted: number;
  updated: number;
  skipped: number;
}

export function CSVImportMapper() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog state
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"select-file" | "configure" | "importing" | "complete">("select-file");

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
  const [uniqueKeyColumn, setUniqueKeyColumn] = useState<string>("");

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
    queryFn: async () => {
      if (!selectedTable || isCreatingNewTable) return [];
      
      // Use information_schema to get column info
      const { data, error } = await supabase.rpc("get_table_columns", {
        table_name_param: selectedTable,
      });

      if (error) {
        console.error("Error fetching columns:", error);
        // Fallback: try to infer from a sample query
        const { data: sampleData, error: sampleError } = await supabase
          .from(selectedTable as any)
          .select("*")
          .limit(1);
        
        if (sampleError || !sampleData?.[0]) return [];
        
        return Object.keys(sampleData[0]).map(col => ({
          column_name: col,
          data_type: "text",
          is_nullable: "YES",
          column_default: null,
        }));
      }

      return (data || []) as TableColumn[];
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

    // Set default unique key
    const tableConfig = AVAILABLE_TABLES.find(t => t.value === tableName);
    if (tableConfig) {
      setUniqueKeyColumn(tableConfig.uniqueKey);
    }
  };

  // Auto-map CSV columns to table columns when table columns are loaded
  const autoMapColumns = useCallback(() => {
    if (!tableColumns || tableColumns.length === 0) return;

    setFieldMappings((prev) =>
      prev.map((mapping) => {
        // Try to find a matching table column
        const matchingColumn = tableColumns.find(
          (col) =>
            col.column_name === mapping.dbColumn ||
            col.column_name === normalizeColumnName(mapping.csvColumn) ||
            col.column_name.includes(normalizeColumnName(mapping.csvColumn)) ||
            normalizeColumnName(mapping.csvColumn).includes(col.column_name)
        );

        return {
          ...mapping,
          dbColumn: matchingColumn?.column_name || mapping.dbColumn,
          isNew: !matchingColumn,
        };
      })
    );
  }, [tableColumns]);

  // Run auto-mapping when table columns load
  useCallback(() => {
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

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      const targetTable = isCreatingNewTable ? newTableName : selectedTable;
      if (!targetTable) throw new Error("No table selected");
      if (!csvContent) throw new Error("No CSV content");

      const enabledMappings = fieldMappings.filter((m) => m.enabled);
      if (enabledMappings.length === 0) throw new Error("No fields selected for import");

      setProgress({
        status: "uploading",
        message: "Sending data to server...",
        total: progress.total,
        processed: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
      });

      setStep("importing");

      const { data, error } = await supabase.functions.invoke("import-csv-mapped", {
        body: {
          csvContent,
          targetTable,
          fieldMappings: enabledMappings.map((m) => ({
            csvColumn: m.csvColumn,
            dbColumn: m.dbColumn,
            type: m.type,
          })),
          uniqueKeyColumn,
          createTable: isCreatingNewTable,
        },
      });

      if (error) throw new Error(error.message || "Import failed");

      return data;
    },
    onSuccess: (data) => {
      setProgress({
        status: "complete",
        message: "Import complete!",
        total: data.total || progress.total,
        processed: data.total || progress.total,
        inserted: data.inserted || 0,
        updated: data.updated || 0,
        skipped: data.skipped || 0,
      });
      setStep("complete");
      queryClient.invalidateQueries();
      toast({
        title: "Import Complete",
        description: `${data.inserted || 0} inserted, ${data.updated || 0} updated`,
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

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
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
            <div className="space-y-6 overflow-hidden flex flex-col h-full">
              {/* File info */}
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
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
              <div className="space-y-2">
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
                <div className="space-y-2">
                  <Label>Unique Key Column (for upsert)</Label>
                  <Select value={uniqueKeyColumn} onValueChange={setUniqueKeyColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unique key column..." />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldMappings
                        .filter((m) => m.enabled)
                        .map((mapping) => (
                          <SelectItem key={mapping.dbColumn} value={mapping.dbColumn}>
                            {mapping.dbColumn}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Field Mappings */}
              {(selectedTable || newTableName) && (
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                  <Label className="mb-2">Field Mappings</Label>
                  <ScrollArea className="flex-1 border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Use</TableHead>
                          <TableHead>CSV Column</TableHead>
                          <TableHead className="w-8"></TableHead>
                          <TableHead>Database Column</TableHead>
                          <TableHead className="w-24">Type</TableHead>
                          <TableHead className="w-20">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fieldMappings.map((mapping, index) => (
                          <TableRow
                            key={index}
                            className={cn(!mapping.enabled && "opacity-50")}
                          >
                            <TableCell>
                              <Checkbox
                                checked={mapping.enabled}
                                onCheckedChange={() => toggleField(index)}
                              />
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {mapping.csvColumn}
                            </TableCell>
                            <TableCell>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={mapping.dbColumn}
                                onChange={(e) =>
                                  updateMapping(index, {
                                    dbColumn: normalizeColumnName(e.target.value),
                                  })
                                }
                                className="h-8 font-mono text-sm"
                                disabled={!mapping.enabled}
                              />
                            </TableCell>
                            <TableCell>
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
                            <TableCell>
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
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}

              {/* Preview */}
              {csvPreview.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Preview (first 5 rows)</Label>
                  <ScrollArea className="h-32 border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {csvHeaders.map((header, i) => (
                            <TableHead key={i} className="text-xs whitespace-nowrap">
                              {header}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvPreview.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <TableCell key={cellIndex} className="text-xs whitespace-nowrap">
                                {cell.length > 30 ? `${cell.slice(0, 30)}...` : cell}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Importing */}
          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <p className="font-medium">{progress.message}</p>
                <p className="text-sm text-muted-foreground">
                  Processing {progress.total.toLocaleString()} records...
                </p>
              </div>
              <Progress value={50} className="w-64" />
            </div>
          )}

          {/* Step 4: Complete */}
          {step === "complete" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Import Complete!</p>
                <p className="text-sm text-muted-foreground">
                  Successfully processed {progress.total.toLocaleString()} records
                </p>
              </div>
              <div className="flex gap-4">
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
            </div>
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
          {step === "complete" && (
            <Button onClick={() => handleOpenChange(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
