import { google } from 'googleapis';

// Configuration
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;

export interface SheetRow {
  [key: string]: string | number;
}

/**
 * Fetch data from Google Sheets
 * @param range - The A1 notation range (e.g., 'Sheet1!A1:D10' or 'Sheet1')
 * @param useHeaders - If true, first row will be used as headers
 * @returns Array of objects with sheet data
 */
export const fetchGoogleSheetData = async (
  range: string = 'Sheet1',
  useHeaders: boolean = true
): Promise<SheetRow[]> => {
  try {
    if (!API_KEY) {
      throw new Error('Google Sheets API key is not configured. Please add VITE_GOOGLE_SHEETS_API_KEY to your .env file');
    }

    if (!SHEET_ID) {
      throw new Error('Google Sheet ID is not configured. Please add VITE_GOOGLE_SHEET_ID to your .env file');
    }

    const sheets = google.sheets({ version: 'v4', auth: API_KEY });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: range,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.warn('No data found in the sheet');
      return [];
    }

    // If useHeaders is true, convert array of arrays to array of objects
    if (useHeaders) {
      const headers = rows[0] as string[];
      const data = rows.slice(1).map((row) => {
        const obj: SheetRow = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });
      return data;
    }

    // Return raw data as array of objects with numeric keys
    return rows.map((row) => {
      const obj: SheetRow = {};
      row.forEach((cell, index) => {
        obj[`column_${index}`] = cell;
      });
      return obj;
    });
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    throw error;
  }
};

/**
 * Fetch multiple sheets at once
 * @param ranges - Array of range strings
 * @returns Object with range names as keys and data as values
 */
export const fetchMultipleRanges = async (
  ranges: string[]
): Promise<{ [key: string]: SheetRow[] }> => {
  try {
    if (!API_KEY || !SHEET_ID) {
      throw new Error('Google Sheets API key or Sheet ID is not configured');
    }

    const sheets = google.sheets({ version: 'v4', auth: API_KEY });

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SHEET_ID,
      ranges: ranges,
    });

    const result: { [key: string]: SheetRow[] } = {};

    response.data.valueRanges?.forEach((valueRange, index) => {
      const rows = valueRange.values;
      if (rows && rows.length > 0) {
        const headers = rows[0] as string[];
        const data = rows.slice(1).map((row) => {
          const obj: SheetRow = {};
          headers.forEach((header, colIndex) => {
            obj[header] = row[colIndex] || '';
          });
          return obj;
        });
        result[ranges[index]] = data;
      }
    });

    return result;
  } catch (error) {
    console.error('Error fetching multiple ranges:', error);
    throw error;
  }
};

/**
 * Get sheet metadata (names, row counts, etc.)
 */
export const getSheetMetadata = async () => {
  try {
    if (!API_KEY || !SHEET_ID) {
      throw new Error('Google Sheets API key or Sheet ID is not configured');
    }

    const sheets = google.sheets({ version: 'v4', auth: API_KEY });

    const response = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
    });

    return {
      title: response.data.properties?.title,
      sheets: response.data.sheets?.map((sheet) => ({
        title: sheet.properties?.title,
        sheetId: sheet.properties?.sheetId,
        rowCount: sheet.properties?.gridProperties?.rowCount,
        columnCount: sheet.properties?.gridProperties?.columnCount,
      })),
    };
  } catch (error) {
    console.error('Error fetching sheet metadata:', error);
    throw error;
  }
};
