import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileSpreadsheet, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { fetchGoogleSheetData, getSheetMetadata, type SheetRow } from "@/lib/googleSheetsService";
import { useToast } from "@/hooks/use-toast";

export default function GoogleSheetData() {
  const [data, setData] = useState<SheetRow[]>([]);
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    loadMetadata();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch data from Sheet1 (change this to your sheet name/range)
      const sheetData = await fetchGoogleSheetData('Sheet1', true);
      setData(sheetData);
      
      toast({
        title: "Success",
        description: `Loaded ${sheetData.length} rows from Google Sheets`,
      });
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch Google Sheets data";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const meta = await getSheetMetadata();
      setMetadata(meta);
    } catch (err) {
      console.error("Failed to load metadata:", err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Google Sheets Data</h1>
            {metadata && (
              <p className="text-sm text-muted-foreground">
                {metadata.title} • {data.length} rows
              </p>
            )}
          </div>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing || loading}
          variant="outline"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Configuration Instructions */}
      {!import.meta.env.VITE_GOOGLE_SHEETS_API_KEY && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Required</AlertTitle>
          <AlertDescription>
            <p>Please configure your Google Sheets API connection:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Create a <code>.env</code> file in your project root</li>
              <li>Add <code>VITE_GOOGLE_SHEETS_API_KEY</code> with your Google API key</li>
              <li>Add <code>VITE_GOOGLE_SHEET_ID</code> with your sheet ID</li>
              <li>Restart the development server</li>
            </ol>
          </AlertDescription>
        </Alert>
      )}

      {/* Sheet Metadata */}
      {metadata?.sheets && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Available Sheets</CardTitle>
              <CardDescription>Sheets in this Google Spreadsheet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {metadata.sheets.map((sheet: any) => (
                  <div
                    key={sheet.sheetId}
                    className="px-3 py-2 bg-secondary rounded-md text-sm"
                  >
                    {sheet.title} ({sheet.rowCount} × {sheet.columnCount})
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Sheet Data</CardTitle>
            <CardDescription>
              Data from your Google Sheet displayed in real-time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-lg">Loading data...</span>
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No data found in the sheet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead key={column}>{column}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row, index) => (
                      <TableRow key={index}>
                        {columns.map((column) => (
                          <TableCell key={column}>{row[column]}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
