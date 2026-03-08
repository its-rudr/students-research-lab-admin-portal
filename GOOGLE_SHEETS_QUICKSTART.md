# 🚀 Quick Start: Google Sheets Integration

## What You Get

✅ Complete Google Sheets API integration  
✅ Ready-to-use React components  
✅ Custom hook for easy data fetching  
✅ Full TypeScript support  
✅ Example components for various use cases

## 5-Minute Setup

### 1️⃣ Get Your Google API Key (2 minutes)

1. Visit: https://console.cloud.google.com/
2. Create a project → Enable "Google Sheets API"
3. Create Credentials → API Key
4. Copy the key

### 2️⃣ Get Your Sheet ID (30 seconds)

From your Google Sheet URL:
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                      This is your Sheet ID
```

### 3️⃣ Configure Environment (1 minute)

Create `.env` file in project root:

```env
VITE_GOOGLE_SHEETS_API_KEY=AIzaSyD...your_key_here
VITE_GOOGLE_SHEET_ID=1BxiMVs0X...your_sheet_id_here
```

### 4️⃣ Make Your Sheet Public (30 seconds)

In Google Sheets:
- File → Share → "Anyone with the link can view"

### 5️⃣ Restart Server (1 minute)

```bash
# Stop server (Ctrl+C)
npm run dev
```

## ✅ Test It!

Navigate to: `http://localhost:5173/google-sheets`

You should see your Google Sheet data displayed! 🎉

---

## 📖 Usage Examples

### Basic Hook Usage

```typescript
import { useGoogleSheet } from '@/hooks/useGoogleSheet';

function MyComponent() {
  const { data, loading, refresh } = useGoogleSheet({
    range: 'Sheet1',
    useHeaders: true,
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {data.map((row, i) => (
        <div key={i}>{JSON.stringify(row)}</div>
      ))}
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

### Fetch from Service

```typescript
import { fetchGoogleSheetData } from '@/lib/googleSheetsService';

const data = await fetchGoogleSheetData('Sheet1', true);
console.log(data);
// [{ Name: 'John', Age: '25', ... }, ...]
```

---

## 🎯 What's Included

### Files Created:

1. **`src/lib/googleSheetsService.ts`** - Core API integration
2. **`src/hooks/useGoogleSheet.ts`** - React hook
3. **`src/pages/GoogleSheetData.tsx`** - Full-featured page
4. **`src/components/GoogleSheetExamples.tsx`** - Usage examples
5. **`GOOGLE_SHEETS_SETUP.md`** - Complete documentation

### Features:

- ✅ Fetch single/multiple sheets
- ✅ Automatic header detection
- ✅ TypeScript types
- ✅ Error handling
- ✅ Loading states
- ✅ Refresh functionality
- ✅ Sheet metadata
- ✅ Multiple range support

---

## 🔗 Navigation

The Google Sheets page is accessible from:
- Sidebar: "Google Sheets" menu item
- URL: `/google-sheets`

---

## 📚 Next Steps

1. **Customize the range**: Edit `GoogleSheetData.tsx` to change which sheet/range to display
2. **Add to existing pages**: Use `useGoogleSheet` hook in any component
3. **Sync to Supabase**: See `GoogleSheetExamples.tsx` for sync examples
4. **Multiple sheets**: Use `fetchMultipleRanges()` for multiple sheets

---

## ❓ Troubleshooting

### "API key not configured"
→ Check `.env` file exists and has correct variable name
→ Restart dev server

### "Permission denied"
→ Make sure sheet is set to "Anyone with link can view"
→ Verify API key in Google Cloud Console

### No data showing
→ Check Sheet ID is correct
→ Verify sheet has data
→ Open browser console for detailed errors

---

## 📞 Need Help?

Check `GOOGLE_SHEETS_SETUP.md` for detailed documentation!
