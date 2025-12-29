# Auto-Save Feature - Quick Guide

**Version:** 2.0 (Automated)
**Date:** December 28, 2025

---

## 🎯 What's New

The Image Management Portal now has **fully automated** image saving:

✅ **Drag & drop** → Image **automatically saved**
✅ **Automatic renaming** → `question_69.jpg`
✅ **JSON auto-updated** → Database stays in sync
✅ **No manual export needed** → Everything happens instantly

---

## 🚀 Setup (One-Time, 30 Seconds)

### **Step 1: Create the Folder**
```
1. Go to your Nephropathology folder
2. Create a new folder named: question_images
3. Leave it empty for now
```

### **Step 2: Select the Folder in Portal**
```
1. Open: image_management_portal.html
2. Click: "📁 Select Folder" button
3. Browser asks: "Allow access to folder?"
4. Navigate to and select: question_images
5. Click: "Select Folder" or "Choose"
```

### **Step 3: Enable Auto-Save (Optional)**
```
1. Check the box: "Auto-save JSON"
2. Status shows: "✅ Auto-save ON"
```

**Done!** Setup complete. You only need to do this once.

---

## ⚡ How It Works

### **Without Auto-Save:**

```
YOU:    Drag image → Drop on question card
PORTAL: ✓ Saves image as question_69.jpg
        ✓ Updates question in memory
        ✓ Shows "✓ Image saved" notification

MANUAL: Click "Manual Export" when done
        → Downloads updated JSON file
```

### **With Auto-Save Enabled:**

```
YOU:    Drag image → Drop on question card
PORTAL: ✓ Saves image as question_69.jpg
        ✓ Updates JSON file automatically
        ✓ Shows "✓ Image saved" notification
        ✓ Shows "✓ Database auto-saved" notification

RESULT: Everything saved instantly!
        No export button needed!
```

### **Remove Image (with Auto-Backup):**

```
YOU:    Click "🗑️ Remove" button on question
PORTAL: ✓ Moves image to REMOVED subfolder
        ✓ Adds timestamp: question_69_2025-12-29.jpg
        ✓ Updates JSON to remove image reference
        ✓ Shows "✓ Image removed and moved to REMOVED folder"

RESULT: Image safely backed up in REMOVED/
        Database updated automatically
        Can recover image if needed
```

---

## 📋 Workflow Comparison

### **Old Workflow (Manual):**
```
1. Drag & drop 10 images
2. Review all changes
3. Click "Export"
4. Download 12 files (JSON + 10 images)
5. Create question_images folder
6. Move 10 images to folder
7. Move JSON to main folder
8. Update portal .js files

Time: ~10 minutes
```

### **New Workflow (Auto-Save):**
```
1. Select folder ONCE (first time only)
2. Enable auto-save checkbox
3. Drag & drop 10 images
   → Each image saves automatically
   → JSON updates automatically

Time: ~2 minutes
No file organization needed!
```

---

## 🎯 Step-by-Step Example

### **Scenario: Replace 5 images**

**Setup (First Time Only):**
```
1. Create "question_images" folder
2. Open portal
3. Click "📁 Select Folder"
4. Choose "question_images"
5. Check "Auto-save JSON"
```

**Usage (Every Time):**
```
1. Find Question #69
2. Drag new_image.jpg to drop zone
   → Instant notification: "✓ Image saved: question_69.jpg"
   → Instant notification: "✓ Database auto-saved"
3. Find Question #71
4. Drag another_image.png
   → Instant notification: "✓ Image saved: question_71.png"
   → Instant notification: "✓ Database auto-saved"
... repeat for questions 73, 75, 77

Done! All images saved, JSON updated.
No export needed!
```

**Result:**
```
question_images/
  ├── question_69.jpg  ← Auto-saved
  ├── question_71.png  ← Auto-saved
  ├── question_73.jpg  ← Auto-saved
  ├── question_75.png  ← Auto-saved
  ├── question_77.jpg  ← Auto-saved
  └── nephro_questions_auto_updated.json  ← Auto-saved
```

---

## 📂 File Locations

### **Images:**
```
Saved to: question_images/question_[ID].[ext]
Example:  question_images/question_69.jpg
```

### **Removed Images (Backup):**
```
Saved to: question_images/REMOVED/question_[ID]_[DATE].[ext]
Example:  question_images/REMOVED/question_69_2025-12-29.jpg
```

**Recovery:** If you accidentally remove an image, you can find it in the REMOVED subfolder with a timestamp. Simply copy it back to the question_images folder and rename it.

### **JSON Database:**
```
Saved to: question_images/nephro_questions_auto_updated.json
Name:     Always the same (overwrites each time)
```

**Note:** The JSON is saved inside the `question_images` folder for convenience. You can move it to the parent folder later if needed.

---

## 🔧 Technical Details

### **Browser Support:**
- ✅ **Chrome 86+** (Recommended)
- ✅ **Edge 86+** (Recommended)
- ⚠️ **Firefox** (Limited support, may not work)
- ⚠️ **Safari** (Not supported)

**Best:** Use Chrome or Edge for full functionality.

### **File System Access API:**
Uses modern browser API to write files directly:
- One-time folder permission
- Direct file writes (no downloads)
- Automatic rename and save
- JSON auto-update

### **Security:**
- Browser asks for permission first
- Only selected folder has write access
- No access to other folders
- Can revoke permission anytime

---

## 🔍 Visual Indicators

### **Toast Notifications:**
```
Bottom-right corner, green background:

✓ Image saved: question_69.jpg    (2 seconds)
✓ Database auto-saved              (2 seconds)
```

### **Status Display:**
```
Before folder selected:
📁 No folder selected
⭕ Auto-save OFF

After folder selected:
✅ Folder: question_images
⭕ Auto-save OFF

After enabling auto-save:
✅ Folder: question_images
✅ Auto-save ON
```

---

## ⚙️ Settings & Preferences

### **Auto-Save Toggle:**
- **OFF:** Images save, JSON doesn't (safer)
- **ON:** Both images and JSON save (faster)

**Recommendation:**
- Use **OFF** if you want to review before saving JSON
- Use **ON** for maximum efficiency

### **Folder Permission:**
- Saved in browser
- Persists across sessions
- May need to reselect after:
  - Clearing browser data
  - Using incognito/private mode
  - First time on new computer

---

## 🐛 Troubleshooting

### **"Browser does not support automatic file saving"**
**Problem:** Using Firefox or Safari
**Solution:** Switch to Chrome or Edge

### **"Could not access folder"**
**Problem:** Permission denied or folder moved
**Solution:**
1. Click "📁 Select Folder" again
2. Navigate to question_images
3. Select it again

### **Images not saving**
**Problem:** Folder permission lost
**Solution:**
1. Check status shows: "✅ Folder: question_images"
2. If not, reselect folder
3. Try dragging image again

### **JSON not auto-saving**
**Problem:** Auto-save toggle not enabled
**Solution:**
1. Check the "Auto-save JSON" checkbox
2. Status should show "✅ Auto-save ON"
3. Try dragging image again

### **Can't find saved files**
**Problem:** Looking in wrong location
**Solution:**
```
Files are in: question_images/ folder
JSON is at:   question_images/nephro_questions_auto_updated.json
Images are:   question_images/question_*.jpg/png
```

---

## 💡 Best Practices

### **Folder Organization:**
```
Recommended structure:

Nephropathology/
├── question_images/                  ← Select this in portal
│   ├── question_69.jpg               ← Auto-saved
│   ├── question_71.png               ← Auto-saved
│   ├── REMOVED/                      ← Auto-created for removed images
│   │   ├── question_69_2025-12-29.jpg  ← Backup of removed image
│   │   └── question_71_2025-12-28.png  ← Backup of removed image
│   └── nephro_questions_auto_updated.json  ← Auto-saved
├── nephro_questions_enhanced.json    ← Original (keep as backup)
├── student_portal_bilingual.html
├── instructor_portal_editable.html
└── image_management_portal.html
```

### **Backup Strategy:**
1. **Never delete** `nephro_questions_enhanced.json` (original)
2. **Auto-saved JSON** is at `question_images/nephro_questions_auto_updated.json`
3. **Removed images** are backed up in `REMOVED/` subfolder with timestamps
4. **Make backups** before major changes
5. **Test portals** after updates

### **Image Removal & Recovery:**
**To Remove an Image:**
1. Click the "🗑️ Remove" button on the question card
2. Confirm the removal
3. Image is automatically moved to `REMOVED/` subfolder with timestamp
4. Database is updated (if auto-save is enabled)

**To Recover a Removed Image:**
1. Navigate to `question_images/REMOVED/` folder
2. Find the image with timestamp (e.g., `question_69_2025-12-29.jpg`)
3. Copy it back to `question_images/` folder
4. Rename to remove timestamp (e.g., `question_69.jpg`)
5. Update the question in the portal to re-add the image path

### **Update Portals:**
After using auto-save, update your portals to use the new JSON:

**Edit:** `student_portal_bilingual.js` (line 12)
```javascript
const response = await fetch('question_images/nephro_questions_auto_updated.json');
```

**Edit:** `instructor_portal_editable.js` (line 11)
```javascript
const response = await fetch('question_images/nephro_questions_auto_updated.json');
```

---

## 📊 Comparison Table

| Feature | Manual Export | Auto-Save |
|---------|--------------|-----------|
| **Setup** | None | One-time folder selection |
| **Drag & Drop** | Stores in memory | Saves to disk instantly |
| **Image Rename** | On export | Automatic |
| **JSON Update** | On export | Automatic (if enabled) |
| **File Organization** | Manual | Automatic |
| **Speed** | Slower | Faster |
| **Safety** | Review before save | Instant save |
| **Browser** | All modern | Chrome/Edge only |

---

## ✅ Checklist

### **First-Time Setup:**
- [ ] Create `question_images` folder
- [ ] Open portal in Chrome or Edge
- [ ] Click "📁 Select Folder"
- [ ] Navigate to and select `question_images`
- [ ] See "✅ Folder: question_images"
- [ ] (Optional) Enable "Auto-save JSON" checkbox
- [ ] See "✅ Auto-save ON" (if enabled)

### **Regular Use:**
- [ ] Portal shows folder is selected
- [ ] Drag image to question card
- [ ] See "✓ Image saved" notification
- [ ] See "✓ Database auto-saved" (if auto-save on)
- [ ] Check question_images folder
- [ ] Verify file saved as question_[ID].[ext]

### **After Changes:**
- [ ] Update portal .js files (if needed)
- [ ] Test both portals
- [ ] Verify images display
- [ ] Create backup of updated JSON

---

## 🎉 Summary

### **What Auto-Save Does:**
✅ Saves images immediately when dropped
✅ Renames to standard format (question_69.jpg)
✅ Updates JSON database (if enabled)
✅ Shows confirmation notifications
✅ No manual file organization needed
✅ **NEW:** Backs up removed images to REMOVED folder

### **What You Do:**
1️⃣ Select folder (once)
2️⃣ Drag & drop images
3️⃣ Remove images safely (auto-backed up)
4️⃣ Done!

### **Time Saved:**
- **Before:** 10 minutes per batch
- **After:** 2 minutes per batch
- **Savings:** 80% faster!

---

## 🚀 Quick Reference

```
Setup:     📁 Select Folder → Choose question_images → Done
Use:       Drag image → Auto-saves
Settings:  ☑ Auto-save JSON (optional)
Location:  question_images/question_69.jpg
JSON:      question_images/nephro_questions_auto_updated.json
Browser:   Chrome or Edge (recommended)
```

---

**Ready to use!**
Open `image_management_portal.html` in Chrome or Edge and select your folder to get started.

---

*For the old manual export method, simply don't select a folder and use the "Manual Export" button instead.*
