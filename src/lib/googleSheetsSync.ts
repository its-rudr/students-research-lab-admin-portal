/**
 * Google Sheets to Supabase Sync Service
 * 
 * This service handles syncing data from Google Sheets to Supabase database.
 * Configure your sheet mappings and column mappings for each table.
 */

import { supabase } from './supabaseClient';
import { fetchGoogleSheetData, fetchMultipleRanges } from './googleSheetsService';

export interface SyncResult {
  success: boolean;
  table: string;
  inserted: number;
  updated: number;
  deleted: number;
  errors: string[];
}

export interface SheetConfig {
  sheetRange: string;
  supabaseTable: string;
  columnMapping: { [sheetColumn: string]: string };
  uniqueKey: string; // Column to use for upsert (e.g., 'enrollment_no')
  clearBeforeSync?: boolean; // If true, deletes all records before syncing
}

/**
 * Configuration for syncing different sheets to Supabase tables
 * Customize these mappings based on your Google Sheets structure
 */
export const SYNC_CONFIGS: SheetConfig[] = [
  {
    sheetRange: 'Students', // Name of the sheet in Google Sheets
    supabaseTable: 'students_details',
    uniqueKey: 'enrollment_no',
    clearBeforeSync: false,
    columnMapping: {
      // Google Sheets column → Supabase column
      'Name': 'student_name',
      'Enrollment No': 'enrollment_no',
      'Email': 'email',
      'Contact': 'contact_no',
      'Department': 'department',
      'Institute': 'institute_name',
      'Semester': 'semester',
      'Division': 'division',
      'Batch': 'batch',
      'Gender': 'gender',
      'Member Type': 'member_type',
    },
  },
  {
    sheetRange: 'Scores',
    supabaseTable: 'debate_scores',
    uniqueKey: 'id',
    clearBeforeSync: false,
    columnMapping: {
      'Enrollment No': 'enrollment_no',
      'Points': 'total_points',
      'Date': 'date',
    },
  },
  {
    sheetRange: 'Attendance',
    supabaseTable: 'attendance',
    uniqueKey: 'id',
    clearBeforeSync: false,
    columnMapping: {
      'Enrollment No': 'enrollment_no',
      'Date': 'date',
      'Hours': 'hours',
    },
  },
  {
    sheetRange: 'Activities',
    supabaseTable: 'activities',
    uniqueKey: 'id',
    clearBeforeSync: false,
    columnMapping: {
      'Title': 'title',
      'Date': 'date',
      'Description': 'description',
    },
  },
];

/**
 * Transform sheet data to match Supabase schema
 */
function transformSheetData(
  sheetData: any[],
  columnMapping: { [key: string]: string }
): any[] {
  return sheetData.map((row) => {
    const transformed: any = {};
    
    Object.entries(columnMapping).forEach(([sheetCol, dbCol]) => {
      if (row[sheetCol] !== undefined && row[sheetCol] !== null && row[sheetCol] !== '') {
        // Handle type conversions
        let value = row[sheetCol];
        
        // Convert numeric strings to numbers for specific fields
        if (dbCol.includes('points') || dbCol.includes('hours') || dbCol.includes('semester')) {
          const numValue = parseFloat(value);
          value = isNaN(numValue) ? value : numValue;
        }
        
        // Trim strings
        if (typeof value === 'string') {
          value = value.trim();
        }
        
        transformed[dbCol] = value;
      }
    });
    
    return transformed;
  });
}

/**
 * Sync a single sheet to Supabase table
 */
/*
export async function syncSheetToTable(config: SheetConfig): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    table: config.supabaseTable,
      }
      result.deleted = 1; // Indicate deletion occurred
    }

    // Upsert data (insert or update based on unique key)
    const { data, error } = await supabase
      .from(config.supabaseTable)
      .upsert(transformedData, {
        onConflict: config.uniqueKey,
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      result.errors.push(`Upsert error: ${error.message}`);
      return result;
    }

    result.success = true;
    result.inserted = data?.length || transformedData.length;
    
  } catch (error: any) {
    result.errors.push(error.message || 'Unknown error occurred');
  }

  return result;
}

/**
 * Sync all configured sheets to Supabase
 */
export async function syncAllSheets(): Promise<SyncResult[]> {
  const results: SyncResult[] = [];

  for (const config of SYNC_CONFIGS) {
    const result = await syncSheetToTable(config);
    results.push(result);
  }

  return results;
}

/**
 * Sync multiple specific sheets
 */
export async function syncSpecificSheets(tableNames: string[]): Promise<SyncResult[]> {
  const configs = SYNC_CONFIGS.filter((c) => tableNames.includes(c.supabaseTable));
  const results: SyncResult[] = [];

  for (const config of configs) {
    const result = await syncSheetToTable(config);
    results.push(result);
  }

  return results;
}

/**
 * Get sync status for all configured sheets
 */
export async function getSyncStatus(): Promise<{
  lastSync: Date | null;
  configs: SheetConfig[];
  connected: boolean;
}> {
  try {
    // Test connection
    const { error } = await supabase.from('students_details').select('id').limit(1);
    
    return {
      lastSync: null, // Could be stored in a metadata table
      configs: SYNC_CONFIGS,
      connected: !error,
    };
  } catch (error) {
    return {
      lastSync: null,
      configs: SYNC_CONFIGS,
      connected: false,
    };
  }
}

/**
 * Validate sheet structure matches expected columns
 */
export async function validateSheetStructure(
  sheetRange: string,
  expectedColumns: string[]
): Promise<{ valid: boolean; missingColumns: string[]; extraColumns: string[] }> {
  try {
    const data = await fetchGoogleSheetData(sheetRange, true);
    
    if (!data || data.length === 0) {
      return { valid: false, missingColumns: expectedColumns, extraColumns: [] };
    }

    const actualColumns = Object.keys(data[0]);
    const missingColumns = expectedColumns.filter((col) => !actualColumns.includes(col));
    const extraColumns = actualColumns.filter((col) => !expectedColumns.includes(col));

    return {
      valid: missingColumns.length === 0,
      missingColumns,
      /*
       * Google Sheets sync functions temporarily disabled
       */
      // export async function syncAllSheets(): Promise<SyncResult[]> { ... }
      // export async function syncSpecificSheets(tableNames: string[]): Promise<SyncResult[]> { ... }
      // export async function getSyncStatus(): Promise<{ lastSync: Date | null; configs: SheetConfig[]; connected: boolean; }> { ... }
