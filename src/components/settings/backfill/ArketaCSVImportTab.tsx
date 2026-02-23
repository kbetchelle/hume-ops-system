import { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useArketaCSVImport } from "@/hooks/useArketaCSVImport";

export default function ArketaCSVImportTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const { importCSV, isImporting, progress, result } = useArketaCSVImport();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) importCSV(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Arketa CSV Import</CardTitle>
          <CardDescription>
            Upload a CSV with columns: First Name, Last Name, Time Booked, Class Name, Class Time, Instructor, Location, Status, Client ID, Class ID, Class Date, Type.
            Records are upserted to arketa_classes and arketa_reservations_history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} disabled={isImporting} />
          <Button onClick={() => fileRef.current?.click()} disabled={isImporting} className="gap-2">
            <Upload className="h-4 w-4" />
            {isImporting ? "Importing..." : "Select CSV File"}
          </Button>

          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{progress.status}</span>
                <span>{progress.current.toLocaleString()} / {progress.total.toLocaleString()}</span>
              </div>
              <Progress value={pct} />
            </div>
          )}

          {result && (
            <Card className="border-border">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  <span className="font-medium">{result.success ? "Import Successful" : "Import Completed with Errors"}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Total rows: <strong>{result.totalRows.toLocaleString()}</strong></span>
                  </div>
                  <Badge variant="secondary">Unique: {result.uniqueRows.toLocaleString()}</Badge>
                  <Badge variant="secondary">Classes: {result.classesUpserted.toLocaleString()}</Badge>
                  <Badge variant="secondary">Reservations: {result.reservationsInserted.toLocaleString()}</Badge>
                </div>
                {result.errors.length > 0 && (
                  <div className="text-sm text-destructive space-y-1 max-h-40 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <p key={i}>• {e}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
