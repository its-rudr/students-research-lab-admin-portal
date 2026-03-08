# 🔄 Google Sheets → Supabase → Frontend Architecture

## Overview

This system provides a **complete data flow** from Google Sheets through Supabase to your frontend:

```
Google Sheets → [Sync Service] → Supabase Database → Frontend Pages
     ↑                                                      ↓
     └─────────────── Manual Sync via UI ──────────────────┘
```

## 🏗️ Architecture Benefits

✅ **Better Performance** - Frontend reads from Supabase (fast database queries)  
✅ **Offline Capability** - Data cached in Supabase  
✅ **Data Validation** - Transform and validate during sync  
✅ **Flexible Queries** - Use Supabase's powerful query capabilities  
✅ **Manual Control** - Sync when you want via UI  

---

## 📁 File Structure

```
src/
├── lib/
│   ├── googleSheetsService.ts    # Google Sheets API integration
│   ├── googleSheetsSync.ts       # NEW: Sync service (Sheets → Supabase)
│   └── supabaseClient.ts         # Supabase client
├── pages/
│   ├── SheetSync.tsx             # NEW: Sync management page
│   ├── GoogleSheetData.tsx       # Direct sheet viewer (optional)
│   ├── Students.tsx              # Reads from Supabase
│   ├── Scores.tsx                # Reads from Supabase
│   ├── Attendance.tsx            # Reads from Supabase
│   └── Activities.tsx            # Reads from Supabase
└── hooks/
    └── useGoogleSheet.ts         # React hook for sheets
```

---

## 🚀 Quick Start

### Step 1: Configure Google Sheets API

Already done! Just ensure your `.env` has:

```env
VITE_GOOGLE_SHEETS_API_KEY=your_api_key
VITE_GOOGLE_SHEET_ID=your_sheet_id
```

### Step 2: Prepare Your Google Sheet

Your Google Sheet should have these tabs with proper column headers:

#### **Students Sheet**
| Name | Enrollment No | Email | Contact | Department | Institute | Semester | Division | Batch | Gender | Member Type |
|------|---------------|-------|---------|------------|-----------|----------|----------|-------|--------|-------------|
| John Doe | 2021001 | john@example.com | 1234567890 | CS | MMPSRPC | 6 | A | 2021 | male | member |

#### **Scores Sheet**
| Enrollment No | Points | Date |
|---------------|--------|------|
| 2021001 | 85 | 2024-03-01 |

#### **Attendance Sheet**
| Enrollment No | Date | Hours |
|---------------|------|-------|
| 2021001 | 2024-03-01 | 8 |

#### **Activities Sheet**
| Title | Date | Description |
|-------|------|-------------|
| Workshop | 2024-03-15 | AI Workshop |

### Step 3: Configure Column Mappings

Edit `src/lib/googleSheetsSync.ts` if your column names differ:

```typescript
export const SYNC_CONFIGS: SheetConfig[] = [
  {
    sheetRange: 'Students',        // Your sheet tab name
    supabaseTable: 'students_details',
    uniqueKey: 'enrollment_no',
    columnMapping: {
      'Name': 'student_name',      // 'Sheet Column': 'database_column'
      'Enrollment No': 'enrollment_no',
      'Email': 'email',
      // ... add more mappings
    },
  },
  // ... more sheet configs
];
```

### Step 4: Initial Sync

1. Navigate to: `http://localhost:5173/sheet-sync`
2. Click **"Sync All"** button
3. Wait for sync to complete
4. Check results!

### Step 5: View Data

Data is now in Supabase! Your existing pages automatically show it:
- **Students**: `/students`
- **Scores**: `/scores`
- **Attendance**: `/attendance`
- **Activities**: `/activities`

---

## 🔧 Configuration Guide

### Adding New Sheet to Sync

1. **Add to Google Sheets** - Create new tab with proper headers

2. **Configure Sync** - Edit `src/lib/googleSheetsSync.ts`:

```typescript
{
  sheetRange: 'MyNewSheet',
  supabaseTable: 'my_table',
  uniqueKey: 'id',
  clearBeforeSync: false,
  columnMapping: {
    'Sheet Header 1': 'db_column_1',
    'Sheet Header 2': 'db_column_2',
  },
}
```

3. **Create Supabase Table** - Ensure table exists with matching columns

4. **Sync** - Use the Sheet Sync page to sync data

### Understanding Sync Options

```typescript
interface SheetConfig {
  sheetRange: string;         // Sheet tab name or A1 notation
  supabaseTable: string;      // Supabase table name
  uniqueKey: string;          // Column for upsert (prevent duplicates)
  clearBeforeSync?: boolean;  // Delete all before sync? (default: false)
  columnMapping: {            // Map sheet columns to DB columns
    [sheetColumn: string]: string;
  };
}
```

**clearBeforeSync Options:**
- `false` (default): Upsert - Updates existing, inserts new
- `true`: Delete all rows, then insert fresh data

---

## 💻 Usage Examples

### Manual Sync via UI

Navigate to `/sheet-sync` and use:
- **Sync All** - Sync all configured sheets
- **Sync Selected** - Select specific sheets to sync

### Programmatic Sync

```typescript
import { syncAllSheets, syncSpecificSheets } from '@/lib/googleSheetsSync';

// Sync all configured sheets
const results = await syncAllSheets();

// Sync specific tables
const results = await syncSpecificSheets(['students_details', 'debate_scores']);

// Check results
results.forEach(result => {
  console.log(`${result.table}: ${result.success ? 'Success' : 'Failed'}`);
  console.log(`Inserted: ${result.inserted} rows`);
});
```

### Auto-Sync on Schedule (Optional)

Add to your page component:

```typescript
useEffect(() => {
  // Sync every 5 minutes
  const interval = setInterval(async () => {
    await syncAllSheets();
  }, 5 * 60 * 1000);

  return () => clearInterval(interval);
}, []);
```

---

## 🎯 Data Flow Examples

### Example 1: Adding a New Student

1. **Add to Google Sheets**
   - Open your Google Sheet
   - Add new row with student data
   
2. **Sync to Supabase**
   - Go to `/sheet-sync`
   - Click "Sync All" or select "students_details"
   
3. **View on Frontend**
   - Navigate to `/students`
   - See new student immediately!

### Example 2: Updating Scores

1. **Update Google Sheets**
   - Modify score values in Scores sheet
   
2. **Sync**
   - Use Sheet Sync page
   
3. **Check Dashboard**
   - View updated leaderboard at `/`

---

## 🔍 Monitoring & Debugging

### Check Sync Status

The Sheet Sync page shows:
- ✅ Successful syncs with row counts
- ❌ Failed syncs with error messages
- 📊 Progress indicators

### Common Issues

#### "No data found in sheet"
- Verify sheet name matches `sheetRange` config
- Check sheet has data rows (not just headers)

#### "Column not found"
- Ensure Google Sheets columns match `columnMapping` keys
- Column names are case-sensitive

#### "Upsert error"
- Check `uniqueKey` column exists in both sheet and database
- Verify data types match (numbers, dates, strings)

### Validation

Use the validation function:

```typescript
import { validateSheetStructure } from '@/lib/googleSheetsSync';

const result = await validateSheetStructure('Students', [
  'Name',
  'Enrollment No',
  'Email',
]);

console.log('Missing columns:', result.missingColumns);
console.log('Extra columns:', result.extraColumns);
```

---

## 🔒 Security Best Practices

1. **Read-Only API Key** - Only grant read access to sheets
2. **Environment Variables** - Never commit credentials
3. **Supabase RLS** - Enable Row Level Security in Supabase
4. **Validation** - Always validate data before sync
5. **Backup** - Keep Supabase backups before major syncs

---

## ⚡ Performance Tips

1. **Batch Updates** - Use upsert instead of individual inserts
2. **Selective Sync** - Sync only changed tables
3. **Indexes** - Add database indexes on frequently queried columns
4. **Pagination** - Use pagination for large datasets in frontend

---

## 🎨 Customization

### Custom Transformation

Edit transform function in `googleSheetsSync.ts`:

```typescript
function transformSheetData(sheetData: any[], columnMapping: any): any[] {
  return sheetData.map(row => {
    const transformed: any = {};
    
    // Custom logic
    if (row['Status'] === 'Active') {
      transformed.is_active = true;
    }
    
    // Calculate fields
    transformed.full_name = `${row['First Name']} ${row['Last Name']}`;
    
    return transformed;
  });
}
```

### Add Sync Webhook (Advanced)

For automatic syncing when sheet changes, you'll need:
1. Google Apps Script to detect changes
2. Backend endpoint to trigger sync
3. Setup not included in this guide

---

## 📚 API Reference

### syncAllSheets()
Syncs all configured sheets to Supabase.

**Returns:** `Promise<SyncResult[]>`

### syncSpecificSheets(tableNames)
Syncs specific tables.

**Parameters:**
- `tableNames: string[]` - Array of Supabase table names

**Returns:** `Promise<SyncResult[]>`

### getSyncStatus()
Gets current sync configuration and status.

**Returns:** `Promise<{ lastSync, configs, connected }>`

---

## 🆘 Support

- **Setup Issues**: See `GOOGLE_SHEETS_SETUP.md`
- **Sync Issues**: Check sync page error messages
- **Database Issues**: Check Supabase dashboard

---

## ✅ Checklist

- [ ] Google Sheets API configured
- [ ] Sheet tabs created with correct headers
- [ ] Column mappings configured in `googleSheetsSync.ts`
- [ ] Supabase tables exist and match schema
- [ ] Initial sync completed successfully
- [ ] Frontend pages display data correctly

---

**You're all set!** 🎉

Your data now flows: **Google Sheets → Supabase → Frontend**
