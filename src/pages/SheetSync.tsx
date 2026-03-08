import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Database,
  FileSpreadsheet,
  ArrowRight,
  Loader2,
  Settings,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  syncAllSheets,
  syncSpecificSheets,
  getSyncStatus,
  SYNC_CONFIGS,
  type SyncResult,
} from "@/lib/googleSheetsSync";
import { useToast } from "@/hooks/use-toast";

export default function SheetSync() {
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    const status = await getSyncStatus();
    setSyncStatus(status);
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    setProgress(0);
    setSyncResults([]);

    try {
      toast({
        title: "Sync Started",
        description: "Syncing all sheets to Supabase...",
      });

      const results = await syncAllSheets();
      setSyncResults(results);
      setProgress(100);

      const successCount = results.filter((r) => r.success).length;
      const totalCount = results.length;

      toast({
        title: successCount === totalCount ? "Sync Complete!" : "Sync Completed with Errors",
        description: `${successCount} of ${totalCount} tables synced successfully`,
        variant: successCount === totalCount ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
      loadSyncStatus();
    }
  };

  const handleSyncSelected = async () => {
    if (selectedTables.length === 0) {
      toast({
        title: "No Tables Selected",
        description: "Please select at least one table to sync",
        variant: "destructive",
      });
      return;
    }

    setSyncing(true);
    setProgress(0);
    setSyncResults([]);

    try {
      toast({
        title: "Sync Started",
        description: `Syncing ${selectedTables.length} selected table(s)...`,
      });

      const results = await syncSpecificSheets(selectedTables);
      setSyncResults(results);
      setProgress(100);

      const successCount = results.filter((r) => r.success).length;
      toast({
        title: "Sync Complete",
        description: `${successCount} of ${selectedTables.length} tables synced successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
      loadSyncStatus();
    }
  };

  const toggleTableSelection = (tableName: string) => {
    setSelectedTables((prev) =>
      prev.includes(tableName)
        ? prev.filter((t) => t !== tableName)
        : [...prev, tableName]
    );
  };

  const isConfigured =
    import.meta.env.VITE_GOOGLE_SHEETS_API_KEY &&
    import.meta.env.VITE_GOOGLE_SHEET_ID;

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-8 w-8 text-green-600" />
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <Database className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Google Sheets Sync</h1>
            <p className="text-sm text-muted-foreground">
              Sync data from Google Sheets to Supabase Database
            </p>
          </div>
        </div>
        <Button onClick={handleSyncAll} disabled={syncing || !isConfigured} size="lg">
          <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          Sync All
        </Button>
      </motion.div>

      {/* Configuration Alert */}
      {!isConfigured && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Required</AlertTitle>
          <AlertDescription>
            Please configure your Google Sheets API credentials in the .env file to use sync
            functionality. See GOOGLE_SHEETS_SETUP.md for instructions.
          </AlertDescription>
        </Alert>
      )}

      {/* Sync Progress */}
      {syncing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Syncing Data...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                Please wait while we sync your data from Google Sheets to Supabase
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Sync Results */}
      {syncResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Sync Results</CardTitle>
              <CardDescription>Summary of the last sync operation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {syncResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.success
                        ? "bg-green-50 border-green-200 dark:bg-green-950/20"
                        : "bg-red-50 border-red-200 dark:bg-red-950/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className="font-semibold">{result.table}</span>
                      </div>
                      <div className="flex gap-2">
                        {result.inserted > 0 && (
                          <Badge variant="secondary">+{result.inserted} rows</Badge>
                        )}
                        {result.deleted > 0 && (
                          <Badge variant="outline">-{result.deleted}</Badge>
                        )}
                      </div>
                    </div>
                    {result.errors.length > 0 && (
                      <div className="mt-2 text-sm text-red-600">
                        {result.errors.map((error, i) => (
                          <p key={i}>• {error}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Configured Sheets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Configured Sheets</CardTitle>
                <CardDescription>
                  Select specific sheets to sync or configure sync settings
                </CardDescription>
              </div>
              <Button
                onClick={handleSyncSelected}
                disabled={syncing || selectedTables.length === 0 || !isConfigured}
                variant="outline"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Selected ({selectedTables.length})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {SYNC_CONFIGS.map((config) => (
                <div
                  key={config.supabaseTable}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedTables.includes(config.supabaseTable)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => toggleTableSelection(config.supabaseTable)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedTables.includes(config.supabaseTable)}
                          onChange={() => {}}
                          className="rounded"
                        />
                        <h4 className="font-semibold">{config.supabaseTable}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Sheet: <span className="font-mono">{config.sheetRange}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Object.keys(config.columnMapping).length} columns mapped
                      </p>
                    </div>
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">Fetch from Google Sheets</h4>
                  <p className="text-sm text-muted-foreground">
                    Data is pulled from configured sheets using Google Sheets API
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">Transform & Validate</h4>
                  <p className="text-sm text-muted-foreground">
                    Column mappings are applied and data is validated
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">Sync to Supabase</h4>
                  <p className="text-sm text-muted-foreground">
                    Data is upserted to Supabase tables (insert or update existing records)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold">Display on Frontend</h4>
                  <p className="text-sm text-muted-foreground">
                    Your pages automatically show the updated data from Supabase
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
