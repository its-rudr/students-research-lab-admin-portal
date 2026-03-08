/**
 * Example: Using Google Sheets Hook in a Component
 * 
 * This example demonstrates how to integrate Google Sheets data
 * into any component using the useGoogleSheet hook.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGoogleSheet } from "@/hooks/useGoogleSheet";
import { Loader2, RefreshCw } from "lucide-react";

export function GoogleSheetExample() {
  // Basic usage with default options
  const { data, loading, error, refresh } = useGoogleSheet({
    range: 'Sheet1',
    useHeaders: true,
    autoFetch: true,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Google Sheets Data</CardTitle>
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {data.map((row, index) => (
            <div key={index} className="border p-4 rounded-lg">
              {Object.entries(row).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <strong>{key}:</strong>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example: Fetching from Multiple Sheets
 */

import { useState, useEffect } from 'react';
import { fetchMultipleRanges } from '@/lib/googleSheetsService';

export function MultipleSheetExample() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchMultipleRanges([
          'Students',
          'Attendance',
          'Scores'
        ]);
        setData(result);
      } catch (err) {
        console.error('Error loading multiple sheets:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      {Object.entries(data).map(([sheetName, rows]) => (
        <Card key={sheetName}>
          <CardHeader>
            <CardTitle>{sheetName}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{(rows as any[]).length} rows loaded</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Example: Syncing Google Sheets to Supabase
 */

import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

export function SyncSheetToSupabase() {
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();
  const { data, fetchData } = useGoogleSheet({ autoFetch: false });

  const handleSync = async () => {
    try {
      setSyncing(true);
      
      // Fetch fresh data from Google Sheets
      const sheetData = await fetchData();
      
      // Transform data if needed
      const transformedData = sheetData.map(row => ({
        name: row['Name'],
        email: row['Email'],
        // Map other fields...
      }));
      
      // Clear existing data (optional)
      await supabase.from('students').delete().neq('id', 0);
      
      // Insert new data
      const { error } = await supabase
        .from('students')
        .insert(transformedData);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Synced ${transformedData.length} records to database`,
      });
    } catch (error: any) {
      toast({
        title: 'Sync Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button onClick={handleSync} disabled={syncing}>
      {syncing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Syncing...
        </>
      ) : (
        'Sync to Database'
      )}
    </Button>
  );
}

/**
 * Example: Displaying Google Sheets in a Table
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function GoogleSheetTable() {
  const { data, loading, refresh } = useGoogleSheet({
    range: 'Sheet1!A1:E100', // Specific range
  });

  // Get column names from first row
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Data Table</CardTitle>
          <Button onClick={refresh} size="sm" variant="ghost">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col}>{col}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((col) => (
                    <TableCell key={col}>{row[col]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Example: Using with Search/Filter
 */

export function FilteredGoogleSheetData() {
  const { data, loading } = useGoogleSheet();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter((row) =>
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 border rounded"
      />
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-2">
          {filteredData.map((row, index) => (
            <div key={index} className="p-4 border rounded">
              {JSON.stringify(row)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
