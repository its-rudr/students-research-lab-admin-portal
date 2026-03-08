# Google Sheets Integration Guide

This guide will help you integrate Google Sheets with your admin portal.

## 📋 Prerequisites

- A Google account
- A Google Sheet you want to integrate
- Google Cloud Platform account (free tier is sufficient)

## 🚀 Setup Steps

### Step 1: Create Google Cloud Project & Enable API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. In the left sidebar, go to **APIs & Services** → **Library**
4. Search for **"Google Sheets API"** and click on it
5. Click **"Enable"** button

### Step 2: Create API Key

1. In Google Cloud Console, go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"API Key"**
3. Copy the generated API key (you'll need this for your .env file)
4. (Optional but recommended) Click on the key name to restrict it:
   - Under "API restrictions", select "Restrict key"
   - Select only "Google Sheets API"
   - Click "Save"

### Step 3: Prepare Your Google Sheet

1. Open your Google Sheet
2. Click **File** → **Share** → **Share with others**
3. Change access to **"Anyone with the link can view"** (for read-only access)
4. Copy your Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit
   ```
   Example: If URL is `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
   Then Sheet ID is: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### Step 4: Configure Your Application

1. Create a `.env` file in your project root (if not already exists)
2. Add the following variables:
   ```env
   VITE_GOOGLE_SHEETS_API_KEY=your_api_key_here
   VITE_GOOGLE_SHEET_ID=your_sheet_id_here
   ```
3. Replace `your_api_key_here` with the API key from Step 2
4. Replace `your_sheet_id_here` with the Sheet ID from Step 3

### Step 5: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Start it again
npm run dev
```

## 📊 Using the Google Sheets Integration

### Basic Usage

The integration is now accessible at `/google-sheets` route in your application.

### Customizing Sheet Range

To customize which sheet and range you want to fetch, edit the `GoogleSheetData.tsx` file:

```typescript
// Fetch from a specific sheet
const sheetData = await fetchGoogleSheetData('Sheet1', true);

// Fetch from a specific range
const sheetData = await fetchGoogleSheetData('Sheet1!A1:E100', true);

// Fetch from multiple sheets
const multipleData = await fetchMultipleRanges(['Sheet1', 'Sheet2', 'Sheet3']);
```

### Data Format

The service automatically converts sheet data to objects:

**Google Sheet:**
| Name | Age | Email |
|------|-----|-------|
| John | 25  | john@example.com |
| Jane | 30  | jane@example.com |

**Returned Data:**
```javascript
[
  { Name: "John", Age: "25", Email: "john@example.com" },
  { Name: "Jane", Age: "30", Email: "jane@example.com" }
]
```

## 🔧 Available Functions

### `fetchGoogleSheetData(range, useHeaders)`
Fetches data from a specific range.
- `range`: Sheet name or A1 notation (e.g., 'Sheet1' or 'Sheet1!A1:D10')
- `useHeaders`: If true, uses first row as column headers

### `fetchMultipleRanges(ranges)`
Fetches data from multiple ranges at once.
- `ranges`: Array of range strings

### `getSheetMetadata()`
Gets information about the spreadsheet (sheet names, row counts, etc.)

## 🎨 Syncing with Supabase (Optional)

If you want to sync Google Sheets data to Supabase for better performance:

1. Create a Supabase table matching your sheet structure
2. Create a sync function:

```typescript
import { supabase } from '@/lib/supabaseClient';
import { fetchGoogleSheetData } from '@/lib/googleSheetsService';

export const syncGoogleSheetToSupabase = async () => {
  // Fetch from Google Sheets
  const sheetData = await fetchGoogleSheetData('Sheet1', true);
  
  // Clear existing data (optional)
  await supabase.from('your_table').delete().neq('id', 0);
  
  // Insert new data
  const { error } = await supabase
    .from('your_table')
    .insert(sheetData);
    
  if (error) throw error;
  
  return sheetData.length;
};
```

3. Set up a cron job or manual sync button to update the data periodically

## 🔒 Security Best Practices

1. **Never commit your .env file** - Add it to `.gitignore`
2. **Restrict API Key** - Limit it to only Google Sheets API
3. **Use Environment Variables** - Never hardcode credentials
4. **Read-Only Access** - Keep sheets as view-only unless you need write access
5. **Service Account** (for production) - Use service accounts instead of API keys

## 🐛 Troubleshooting

### Error: "API key is not configured"
- Ensure `.env` file exists in project root
- Check variable names match exactly: `VITE_GOOGLE_SHEETS_API_KEY`
- Restart development server after creating/modifying `.env`

### Error: "The caller does not have permission"
- Make sure Google Sheets API is enabled in Google Cloud Console
- Verify your sheet is set to "Anyone with the link can view"
- Check API key restrictions aren't too strict

### Error: "Unable to parse range"
- Verify sheet name is correct (case-sensitive)
- Use proper A1 notation: 'Sheet1!A1:D10'
- Check if the sheet/range exists

### No data returned
- Verify Sheet ID is correct
- Check if the sheet has data
- Ensure first row contains headers when `useHeaders` is true

## 📚 Additional Resources

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)

## 🎯 Example Use Cases

1. **Student Database** - Maintain student records in Google Sheets
2. **Attendance Tracking** - Track attendance data
3. **Score Management** - Update and display scores
4. **Activity Calendar** - Sync events from a shared calendar sheet
5. **Research Data** - Display research papers and publications

## 💡 Tips

- Use Google Sheets as a CMS for non-technical users
- Combine with Supabase for hybrid approach (cache + real-time)
- Set up webhooks for automatic updates (requires backend)
- Use conditional formatting in sheets for data validation
