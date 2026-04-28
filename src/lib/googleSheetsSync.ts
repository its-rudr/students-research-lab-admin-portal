/**
 * Google Sheets to Prisma/Neon Sync Service
 * 
 * This service handles syncing data from Google Sheets to your Neon (Postgres) database via Prisma ORM.
 * Configure your sheet mappings and column mappings for each table.
 */

import prisma from './prismaClient';
import { fetchGoogleSheetData } from './googleSheetsService';

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
  prismaTable: string; // Will be used as Prisma model name
  columnMapping: { [sheetColumn: string]: string };
  uniqueKey: string; // Column to use for upsert (e.g., 'enrollment_no')
  clearBeforeSync?: boolean; // If true, deletes all records before syncing
}

/**
 * Configuration for syncing different sheets to database tables (via Prisma)
 * Customize these mappings based on your Google Sheets structure
 */
// Table names should match Prisma model names
export const SYNC_CONFIGS: SheetConfig[] = [
  {
    sheetRange: 'Students',
    prismaTable: 'students_details',
    uniqueKey: 'enrollment_no',
    clearBeforeSync: false,
    columnMapping: {
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
    prismaTable: 'debate_scores',
    uniqueKey: 'id',
    clearBeforeSync: false,
    columnMapping: {
      'Enrollment No': 'enrollment_no',
      'Points': 'points',
      'Date': 'date',
    },
  },
  {
    sheetRange: 'Attendance',
    prismaTable: 'attendance',
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
    prismaTable: 'activities',
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
 * Transform sheet data to match database schema
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
 * Sync a single sheet to a database table (via Prisma)
 */
export async function syncSheetToTable(config: SheetConfig): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    table: config.prismaTable,
    inserted: 0,
    updated: 0,
    deleted: 0,
    errors: [],
  };
  try {
    const sheetData = await fetchGoogleSheetData(config.sheetRange, true);
    if (!sheetData || sheetData.length === 0) {
      result.errors.push(`No data found in sheet: ${config.sheetRange}`);
      return result;
    }
    const transformedData = transformSheetData(sheetData, config.columnMapping);
    // Use Prisma for DB operations
    const model = (prisma as any)[config.prismaTable];
    if (!model) {
      result.errors.push(`Model ${config.prismaTable} not found in Prisma client.`);
      return result;
    }
    if (config.clearBeforeSync) {
      try {
        await model.deleteMany({});
        result.deleted = 1;
      } catch (deleteError: any) {
        result.errors.push(`Delete error: ${deleteError.message}`);
        return result;
      }
    }
    let inserted = 0;
    let updated = 0;
    for (const row of transformedData) {
      try {
        // Upsert logic: update if exists, else create
        const where = { [config.uniqueKey]: row[config.uniqueKey] };
        const existing = await model.findUnique({ where });
        if (existing) {
          await model.update({ where, data: row });
          updated++;
        } else {
          await model.create({ data: row });
          inserted++;
        }
      } catch (e: any) {
        result.errors.push(e.message || 'Unknown error during upsert');
      }
    }
    result.success = result.errors.length === 0;
    result.inserted = inserted;
    result.updated = updated;
  } catch (error: any) {
    result.errors.push(error.message || 'Unknown error occurred');
  }
  return result;
}

/**
 * Sync all configured sheets to database (via Prisma)
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
  const configs = SYNC_CONFIGS.filter((c) => tableNames.includes(c.prismaTable));
  const results: SyncResult[] = [];

  for (const config of configs) {
    const result = await syncSheetToTable(config);
    results.push(result);
  }

  return results;
}
