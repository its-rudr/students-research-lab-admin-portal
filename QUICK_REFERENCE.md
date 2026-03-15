# 🚀 Quick Reference: Sheets → Supabase → Frontend

## Your Complete System

```
┌─────────────────┐
│  Google Sheets  │  ← Edit data here (user-friendly)
└────────┬────────┘
         │
         │ Manual Sync via UI
         ↓
┌─────────────────┐
│    Supabase     │  ← Database (fast & reliable)
│    Database     │
└────────┬────────┘
         │
         │ Auto-fetch on page load
         ↓
┌─────────────────┐
│    Frontend     │  ← Pages display data
│     Pages       │
└─────────────────┘
```

---

## 🔧 Setup (One Time)

### 1. Environment Variables (.env)
```env
VITE_GOOGLE_SHEETS_API_KEY=your_key_here
VITE_GOOGLE_SHEET_ID=your_sheet_id_here
```

### 2. Google Sheet Structure

Create tabs in your Google Sheet with these exact headers:

**Students Tab:**
```
Name | Enrollment No | Email | Contact | Department | Institute | Semester | Division | Batch | Gender | Member Type
```

**Scores Tab:**
```
Enrollment No | Points | Date
```

**Attendance Tab:**
```
Enrollment No | Date | Hours
```

**Activities Tab:**
```
Title | Date | Description
```

### 3. Initial Sync
1. Go to: `/sheet-sync`
2. Click "Sync All"
3. Done! ✅

---

## 🎯 Daily Workflow

### To Update Data:

1. **Edit Google Sheets** 
   - Open your Google Sheet
   - Make changes (add/edit/delete rows)
   - Save (auto-saves)

2. **Sync to Database**
   - Open your app: `/sheet-sync`
   - Click "Sync All" or select specific sheets
   - Wait for confirmation

3. **View Updates**
   - Navigate to any page (Students, Scores, etc.)
   - Data automatically refreshed from database!

---

## 📍 Important Pages

| Page | URL | Purpose |
|------|-----|---------|
| **Sheet Sync** | `/sheet-sync` | Sync Google Sheets to database |
| **Students** | `/students` | View synced student data |
| **Scores** | `/scores` | View synced scores |
| **Attendance** | `/attendance` | View synced attendance |
| **Activities** | `/activities` | View synced activities |
| **Google Sheets** | `/google-sheets` | Direct sheet viewer (optional) |

---

## 💡 Common Tasks

### Add New Student
```
1. Add row in Google Sheets "Students" tab
2. Go to /sheet-sync → Click "Sync All"
3. Check /students page
```

### Update Scores
```
1. Edit scores in "Scores" tab
2. Go to /sheet-sync → Sync "debate_scores"
3. Check /scores or dashboard
```

### Bulk Update
```
1. Edit multiple rows in Google Sheets
2. Single sync syncs everything at once
3. All pages update automatically
```

---

## 🔧 Configuration

### Change Column Names?

Edit `src/lib/googleSheetsSync.ts`:

```typescript
columnMapping: {
  'Your Sheet Column': 'database_column',
  'Student Name': 'student_name',
  // ... etc
}
```

### Add New Sheet?

```typescript
{
  sheetRange: 'NewSheetName',
  supabaseTable: 'table_name',
  uniqueKey: 'id',
  columnMapping: { /* ... */ },
}
```

---

## ❓ Troubleshooting

### Sync fails?
- Check internet connection
- Verify API key in `.env`
- Check Google Sheet is shared (view access)

### Data not showing?
- Did you click "Sync"?
- Check sync results for errors
- Verify column names match config

### Columns mismatch?
- Sheet headers must match `columnMapping` keys EXACTLY
- Case-sensitive: "Name" ≠ "name"

---

## 🎨 Features

✅ **Google Sheets as CMS** - Non-technical users can edit data  
✅ **Fast Frontend** - Database queries instead of API calls  
✅ **Manual Control** - Sync when you want  
✅ **Validation** - Data transformed and validated during sync  
✅ **No Duplicates** - Upsert prevents duplicate records  
✅ **Selective Sync** - Sync specific tables only  

---

## 📊 Data Flow Explained

### When You Edit Google Sheets:
1. Data sits in Google Sheets (not live)
2. Click "Sync" button
3. System pulls from Google Sheets
4. Validates & transforms data
5. Pushes to Supabase
6. Frontend pages read from Supabase

### When You Open a Page:
1. Page loads
2. Fetches data from Supabase (fast!)
3. Displays data
4. No Google Sheets API calls needed

---

## 🔑 Key Files

```
src/
├── lib/
│   ├── googleSheetsService.ts     # Talks to Google Sheets API
│   ├── googleSheetsSync.ts        # Syncs Sheets → Supabase
│   └── supabaseClient.ts          # Talks to Supabase
└── pages/
    ├── SheetSync.tsx              # Sync management UI
    ├── Students.tsx               # Shows students from DB
    ├── Scores.tsx                 # Shows scores from DB
    └── ... (all read from Supabase)
```

---

## 🎯 Best Practices

1. **Regular Syncs** - Sync after making changes
2. **Test First** - Make small changes, sync, verify
3. **Backup** - Keep a copy of your Google Sheet
4. **Validation** - Check sync results page for errors
5. **Column Names** - Keep headers consistent

---

## 📞 Quick Help

**Error: "No data found"**
→ Check sheet name in config matches actual sheet tab name

**Error: "Column not found"**
→ Verify column headers in Google Sheets match config

**Data not updating**
→ Click "Sync" button manually

**Want auto-sync?**
→ Add interval timer (see documentation)

---

## ✅ Quick Checklist

Daily tasks:
- [ ] Edit Google Sheets as needed
- [ ] Click "Sync All" in app
- [ ] Verify data on respective pages

Setup tasks (one time):
- [ ] Google API key configured
- [ ] Sheet tabs created
- [ ] Initial sync completed
- [ ] All pages working

---

**That's it!** You now have a complete Google Sheets ↔ Database ↔ Frontend system! 🎉

**Edit in Sheets → Sync → View in App** ✨
