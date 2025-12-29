# Image Management Portal - Quick Start

## 🚀 What Was Created

**New Portal:** `image_management_portal.html`
- Specialized tool for managing question images
- Drag & drop interface
- Visual gallery view
- Export functionality

---

## 📸 Key Features

### **1. Visual Gallery**
- See all 120 questions in card layout
- Preview current images
- Filter by disease or status
- Track modifications

### **2. Drag & Drop Replacement**
- Drag images from your computer
- Drop directly on question cards
- Instant preview
- No coding required

### **3. Image Management**
- Add images to questions without images
- Replace existing images
- Remove unwanted images
- Undo changes before export

### **4. Safe Export**
- Creates new JSON file (doesn't modify original)
- Downloads all modified images automatically
- Generates instruction file
- Standard naming: `question_69.jpg`

---

## 🎯 How to Use (30 seconds)

### **Open the Portal:**
```
1. Open: image_management_portal.html
2. Portal loads automatically
3. See all 120 questions
```

### **Replace an Image:**
```
1. Find the question card
2. Drag your image file to the drop zone
3. Preview appears instantly
4. Green dot marks it as modified
```

### **Export Changes:**
```
1. Click "Export Updated Database"
2. Three files download:
   - Updated JSON database
   - Modified images (auto-named)
   - Instructions file
3. Done!
```

---

## 📊 What You'll See

### **Statistics Panel:**
```
┌─────────────────────────────────────┐
│ Total: 120 | Images: 36 | Modified: 0 │
│ [Disease ▼] [Status ▼]               │
│ [💾 Export] [🔄 Reset]                │
└─────────────────────────────────────┘
```

### **Question Card:**
```
┌──────────────────────────┐
│ Question #69 ●           │ ← Green dot = modified
│ Minimal change disease...│
│ [Disease Badge]          │
├──────────────────────────┤
│ Current Image:           │
│ [Image Preview]          │ ← Click to zoom
├──────────────────────────┤
│     📤                   │
│ Drop image here          │ ← Drag & drop zone
│ or click to browse       │
├──────────────────────────┤
│ [👁️ View] [↺ Undo] [🗑️]  │ ← Actions
└──────────────────────────┘
```

---

## 💡 Common Tasks

### **Task 1: Add Image to Question**
```
Problem: Question #85 has no image
Solution:
1. Find question #85
2. Drag image to drop zone
3. Preview appears
4. Export when ready
```

### **Task 2: Replace Low Quality Image**
```
Problem: Question #69 image is blurry
Solution:
1. Find question #69
2. Drag better image
3. Old image is replaced
4. Export to save
```

### **Task 3: Update All Diabetic Images**
```
Problem: Need new images for all diabetic questions
Solution:
1. Filter: "Diabetic Glomerulosclerosis"
2. Shows 4 questions
3. Replace each image
4. Export once
```

### **Task 4: Remove Unwanted Images**
```
Problem: Some images are incorrect
Solution:
1. Find the questions
2. Click "🗑️ Remove"
3. Confirm removal
4. Export to save
```

---

## 📁 After Export - File Organization

### **What Downloads:**
```
✓ nephro_questions_image_updated_2025-12-28.json
✓ image_replacement_instructions_2025-12-28.txt
✓ question_69.jpg
✓ question_71.png
✓ question_73.jpg
... (one file per modified question)
```

### **Create This Structure:**
```
Nephropathology/
├── question_images/              ← Create this folder
│   ├── question_69.jpg          ← Move images here
│   ├── question_71.png
│   └── question_73.jpg
├── nephro_questions_image_updated_2025-12-28.json
├── student_portal_bilingual.html
├── instructor_portal_editable.html
└── image_management_portal.html
```

### **Update Portals:**
Edit the JavaScript files to load the new database:

**student_portal_bilingual.js (line 12):**
```javascript
// Change from:
const response = await fetch('nephro_questions_enhanced.json');

// To:
const response = await fetch('nephro_questions_image_updated_2025-12-28.json');
```

**instructor_portal_editable.js (line 11):**
```javascript
// Same change
const response = await fetch('nephro_questions_image_updated_2025-12-28.json');
```

---

## ⚡ Quick Tips

### **Efficiency Tips:**
1. **Filter first** - Narrow down before replacing
2. **Use drag & drop** - Faster than browse
3. **Review in lightbox** - Check quality before export
4. **Batch by disease** - Replace all MCD, then all MGN, etc.
5. **Export once** - Do all replacements, then one export

### **Quality Tips:**
1. **High resolution** - At least 800x600 pixels
2. **Clear focus** - Important features visible
3. **Good contrast** - Easy to see details
4. **Proper format** - JPG for photos, PNG for diagrams
5. **Reasonable size** - Under 2 MB per image

### **Safety Tips:**
1. **Preview first** - Always check before export
2. **Undo mistakes** - Use ↺ button if needed
3. **Reset if confused** - 🔄 starts fresh
4. **Keep original** - Never delete nephro_questions_enhanced.json
5. **Test after export** - Verify portals work

---

## 🎬 Workflow Example

**Scenario:** Replace 5 low-quality images

```
1. Open image_management_portal.html
   ↓
2. Filter: "With Images Only" (shows 36)
   ↓
3. Find questions #69, 71, 73, 75, 77
   ↓
4. Drag new image to each drop zone
   (Green dots appear, Modified: 5)
   ↓
5. Click each to view full-size (verify quality)
   ↓
6. Click "💾 Export Updated Database"
   ↓
7. Three files download automatically
   ↓
8. Create "question_images" folder
   ↓
9. Move 5 downloaded images to folder
   ↓
10. Update portal JavaScript files
   ↓
11. Test both portals
   ↓
Done! ✅
```

**Time:** ~5 minutes for 5 images

---

## 🔍 Filter Guide

### **Disease Filter:**
```
All Diseases             → Shows all 120
Minimal Change Disease   → Shows 15 questions
Membranous Nephropathy   → Shows 20 questions
IgA Nephropathy          → Shows 10 questions
... etc
```

### **Status Filter:**
```
All Questions    → Shows all 120
With Images Only → Shows 36 (those that have images)
Modified Only    → Shows only changed questions
```

### **Combine Filters:**
```
Disease: "Diabetic" + Status: "With Images"
→ Shows only diabetic questions that have images
```

---

## ⚠️ Important Notes

### **Before You Start:**
- ✅ Portal works in modern browsers (Chrome, Edge, Firefox)
- ✅ No installation needed
- ✅ All processing happens locally (client-side)
- ✅ Original files never modified

### **While Working:**
- ⚠️ Changes stored in browser memory until export
- ⚠️ Refresh page = lose unsaved changes
- ⚠️ Export regularly to save progress
- ⚠️ Maximum 5 MB per image

### **After Export:**
- ✅ New files created (original preserved)
- ✅ All images auto-named (question_ID.ext)
- ✅ Instructions file included
- ✅ Ready to deploy

---

## 📊 Statistics Explained

### **Total Questions: 120**
- Never changes
- Total in database

### **With Images: 36**
- Currently 36 have images
- Increases when you add
- Decreases when you remove

### **Modified: 0**
- Starts at 0
- Increases with each change
- Resets to 0 after export

**Example:**
```
Start:  Total: 120, Images: 36, Modified: 0
Add 3:  Total: 120, Images: 39, Modified: 3
Del 1:  Total: 120, Images: 38, Modified: 4
Export: Total: 120, Images: 38, Modified: 0 (reset)
```

---

## 🎨 Visual Indicators

### **Green Dot (●):**
- Appears next to question number
- Means: This question has been modified
- Disappears after export or undo

### **"NEW:" Label:**
- Shows in image path
- Means: This is a new image (not saved yet)
- Example: "NEW: my_image.jpg"

### **Badges:**
- Disease name badge (blue)
- Shows which disease category
- Helps with identification

---

## ✅ Checklist

### **Before Export:**
- [ ] All desired images replaced
- [ ] Previewed in full-size
- [ ] Green dots on correct questions
- [ ] Modified counter is correct
- [ ] No pending changes needed

### **After Export:**
- [ ] 3 files downloaded
- [ ] question_images folder created
- [ ] Images moved to folder
- [ ] Portal JS files updated
- [ ] Both portals tested
- [ ] Images display correctly

---

## 🎉 You're Ready!

**Portal Location:**
`image_management_portal.html`

**Full Documentation:**
`IMAGE_MANAGEMENT_GUIDE.md`

**Support:**
Refer to the full guide for detailed instructions and troubleshooting.

---

**Status:** ✅ Ready to Use
**Difficulty:** Easy (drag & drop)
**Time:** 5-10 minutes for typical updates

**Open the portal and start managing images now!**
