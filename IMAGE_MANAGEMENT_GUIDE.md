# Image Management Portal - User Guide

**Version:** 1.0
**Date:** December 28, 2025
**Purpose:** Manage and replace images for nephropathology questions

---

## 📋 Overview

The **Image Management Portal** is a specialized tool for instructors to:
- View all questions with their associated images
- Replace images using drag & drop
- Remove images from questions
- Export updated database with new image references
- Track all modifications

---

## 🚀 Getting Started

### **Opening the Portal:**

1. Navigate to your Nephropathology folder
2. Open `image_management_portal.html` in a web browser
3. The portal will automatically load all questions from `nephro_questions_enhanced.json`

### **Initial View:**

You'll see:
- **Header:** Portal title and description
- **Control Panel:** Statistics and filters
- **Gallery:** Grid of question cards with images

---

## 📊 Control Panel

### **Statistics:**

**Total Questions**
- Shows total number of questions in database
- Current: 120 questions

**With Images**
- Shows how many questions have images
- Current: 36 questions
- Updates when you add/remove images

**Modified**
- Shows how many questions have pending changes
- Resets to 0 when you export or reset
- Green indicator (●) on modified question cards

### **Filters:**

**Disease Filter:**
- Dropdown showing all diseases
- Select a disease to show only those questions
- "All Diseases" shows everything

**Status Filter:**
- **All Questions:** Shows all 120 questions
- **With Images Only:** Shows only 36 questions that have images
- **Modified Only:** Shows only questions with pending changes

### **Action Buttons:**

**💾 Export Updated Database**
- Saves your changes to a new JSON file
- Downloads all modified images
- Creates instruction file
- Only enabled when you have modifications

**🔄 Reset All Changes**
- Discards all pending modifications
- Restores original state
- Requires confirmation

---

## 🖼️ Question Cards

Each card displays:

### **Header Section:**
```
Question #69 ●         ← Green dot = modified
Minimal change disease shows...
[Disease Badge]
```

### **Current Image:**
- Shows the currently assigned image
- Click to view full-size in lightbox
- Displays image file path
- Shows "No image assigned" if none

### **Drop Zone:**
```
📤
Drop image here or click to browse
Supports: JPG, PNG, GIF
```

### **Action Buttons:**
- **👁️ View Full Size** - Opens lightbox
- **↺ Undo** - Cancel replacement (only if modified)
- **🗑️ Remove** - Remove image from question

---

## 🎯 How to Replace Images

### **Method 1: Drag & Drop (Recommended)**

1. **Find your image file** on your computer
2. **Drag the file** to the drop zone on the question card
3. **Drop it** - the image will be uploaded instantly
4. **Preview appears** - you'll see the new image
5. **Card is marked modified** - green dot appears

### **Method 2: Click to Browse**

1. **Click the drop zone** on any question card
2. **File browser opens** - select your image
3. **Click "Open"** - image uploads
4. **Preview appears** - see your new image

### **Supported Formats:**
- ✅ JPG / JPEG
- ✅ PNG
- ✅ GIF
- ✅ Maximum size: 5 MB

### **What Happens:**
- Original image is **not deleted** (safe operation)
- New image is stored in browser memory
- Green dot (●) appears next to question number
- "Modified" counter increases
- Action buttons update (Undo appears)

---

## 🗑️ Removing Images

### **To Remove an Image:**

1. Find the question card
2. Click **🗑️ Remove** button
3. Confirm the removal
4. Image preview is removed
5. Card is marked as modified

### **What Happens:**
- Image reference will be removed from database
- Question will show "No image assigned"
- Change is tracked as modification
- Can be undone before export

---

## ↺ Undoing Changes

### **To Undo a Single Question:**

1. Find the modified question (look for green ●)
2. Click **↺ Undo** button
3. Confirm the action
4. Original state is restored

### **To Undo All Changes:**

1. Click **🔄 Reset All Changes** in control panel
2. Confirm the reset
3. All modifications are discarded
4. "Modified" counter resets to 0

---

## 💾 Exporting Your Changes

### **When to Export:**

Export when you've:
- Replaced all desired images
- Reviewed all changes
- Are ready to use the new database

### **Export Process:**

1. Click **💾 Export Updated Database**
2. Confirm the export (shows number of modifications)
3. **Three files download automatically:**

   a. **Updated JSON Database**
   - Filename: `nephro_questions_image_updated_YYYY-MM-DD.json`
   - Contains all questions with updated image references
   - Use this with your portals

   b. **Image Replacement Instructions**
   - Filename: `image_replacement_instructions_YYYY-MM-DD.txt`
   - Lists all modified images
   - Explains how to organize files

   c. **Modified Images**
   - Individual files: `question_69.jpg`, `question_71.png`, etc.
   - One file per modified question
   - Automatically named and downloaded

### **After Export:**

Follow these steps to complete the update:

1. **Create folder structure:**
   ```
   Nephropathology/
   ├── question_images/           ← Create this folder
   │   ├── question_69.jpg        ← Move downloaded images here
   │   ├── question_71.png
   │   └── question_73.jpg
   ├── nephro_questions_image_updated_2025-12-28.json
   └── [other portal files]
   ```

2. **Organize the images:**
   - Create a folder named `question_images`
   - Move all downloaded images into this folder
   - Keep the filenames as downloaded (e.g., `question_69.jpg`)

3. **Update your portals:**
   - Open `student_portal_bilingual.js`
   - Update the fetch line to load the new JSON file:
     ```javascript
     const response = await fetch('nephro_questions_image_updated_2025-12-28.json');
     ```
   - Do the same for `instructor_portal_editable.js`

4. **Test the portals:**
   - Open both portals in browser
   - Verify images display correctly
   - Check all modified questions

---

## 🎨 Image Best Practices

### **Image Quality:**
- **Resolution:** At least 800x600 pixels
- **Format:** JPG for photos, PNG for diagrams
- **File Size:** Under 2 MB for faster loading
- **Aspect Ratio:** Any, but 4:3 or 16:9 works best

### **Image Content:**
- **Medical Images:** High quality microscopy
- **Clear Focus:** Important features visible
- **Good Contrast:** Easy to see on screen
- **Proper Orientation:** Right-side up, properly rotated

### **Naming Convention:**
After export, images are automatically named:
```
question_[ID].[extension]
Examples:
- question_69.jpg
- question_71.png
- question_73.jpg
```

This standardized naming:
- ✅ Easy to identify which question
- ✅ No conflicts or duplicates
- ✅ Consistent across database
- ✅ Simple to manage

---

## 🔍 Viewing Images

### **In-Card Preview:**
- Click any image in a question card
- Opens full-size lightbox overlay
- Dark background for focus

### **Lightbox Controls:**
- **Click X** - Close lightbox
- **Press Escape** - Close lightbox
- **Click outside image** - Close lightbox

---

## 📱 Responsive Design

### **Desktop:**
- Grid layout with 2-3 cards per row
- Full-size images
- Easy drag & drop

### **Tablet:**
- 1-2 cards per row
- Touch-friendly buttons
- Tap to upload

### **Mobile:**
- Single column
- Stack layout
- Touch optimized

---

## ⚠️ Important Notes

### **Browser Compatibility:**
- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

### **Data Storage:**
- Images stored in **browser memory** until export
- **Not saved to disk** automatically
- **Must export** to save changes
- **Refresh page** = lose unsaved changes

### **File Limitations:**
- Maximum file size: **5 MB per image**
- Supported formats: JPG, PNG, GIF
- One image per question
- No video or animated GIF support

### **Safety:**
- Original database **never modified**
- Original images **never deleted**
- Export creates **new files**
- Can **reset** anytime before export

---

## 🐛 Troubleshooting

### **"Error Loading Questions"**
**Problem:** Database file not found
**Solution:**
- Ensure `nephro_questions_enhanced.json` is in the same folder
- Check file name spelling
- Try hard refresh (Ctrl+F5)

### **Image Not Uploading**
**Problem:** Drag & drop not working
**Solution:**
- Try click to browse instead
- Check file size (must be < 5 MB)
- Verify file format (JPG, PNG, GIF only)
- Try different browser

### **Preview Shows "Image Not Found"**
**Problem:** Original image path broken
**Solution:**
- This is expected if original image is missing
- Replace with new image using drag & drop
- The new image will work correctly

### **Export Downloads Nothing**
**Problem:** No files download
**Solution:**
- Check browser download settings
- Allow downloads from this site
- Try different browser
- Check if pop-up blocker is active

### **Modified Counter Stuck**
**Problem:** Counter shows changes but no cards marked
**Solution:**
- Use filters to find modified questions
- Set filter to "Modified Only"
- Or click "Reset All Changes"

---

## 💡 Tips & Tricks

### **Bulk Operations:**
1. **Filter by disease** first
2. **Replace all images** for that disease
3. **Move to next disease**
4. **Export when all done**

### **Organizing Workflow:**
1. **Review all questions** with images first
2. **Identify which need replacement**
3. **Prepare all new images** in a folder
4. **Batch upload** using drag & drop
5. **Export once** at the end

### **Quality Check:**
1. **View full-size** before confirming
2. **Check image clarity** in lightbox
3. **Verify correct question** (check assertion text)
4. **Undo if mistake** found

### **Keyboard Shortcuts:**
- **Escape** - Close lightbox
- No other shortcuts (click-based interface)

---

## 📊 Workflow Example

### **Complete Image Replacement Workflow:**

**Step 1: Preparation**
```
1. Gather all new images in a folder
2. Name them descriptively (e.g., "MCD_foot_process.jpg")
3. Open image management portal
```

**Step 2: Filter & Find**
```
1. Select disease filter (e.g., "Minimal Change Disease")
2. Review all questions for that disease
3. Identify which images need replacement
```

**Step 3: Replace Images**
```
1. Drag new image to question card
2. Verify preview looks correct
3. Check green dot appears (modified)
4. Repeat for all questions
```

**Step 4: Review**
```
1. Filter by "Modified Only"
2. Review all changes
3. View full-size in lightbox
4. Undo any mistakes
```

**Step 5: Export**
```
1. Click "Export Updated Database"
2. Wait for 3 downloads:
   - Updated JSON
   - Instructions file
   - All modified images
```

**Step 6: Organize**
```
1. Create "question_images" folder
2. Move all downloaded images there
3. Read instructions file
4. Verify all images present
```

**Step 7: Deploy**
```
1. Update portal JavaScript files
2. Point to new JSON file
3. Test both portals
4. Verify images display
```

---

## 🎯 Use Cases

### **Use Case 1: Upgrading Image Quality**
**Scenario:** You have better quality images for existing questions

**Steps:**
1. Filter "With Images Only"
2. For each question, drag new high-res image
3. Export when done
4. Deploy to portals

**Result:** All questions now have higher quality images

---

### **Use Case 2: Adding Images to Questions**
**Scenario:** Questions 90-95 need images added

**Steps:**
1. Filter "All Questions"
2. Scroll to questions 90-95
3. Drag images to each drop zone
4. Export database
5. Update portals

**Result:** 6 more questions now have images

---

### **Use Case 3: Changing Disease-Specific Images**
**Scenario:** Replace all Diabetic Nephropathy images

**Steps:**
1. Filter by "Diabetic Glomerulosclerosis"
2. Shows only 4 questions with images
3. Replace each image
4. Export when satisfied
5. Deploy

**Result:** All diabetic questions have updated images

---

### **Use Case 4: Removing Inappropriate Images**
**Scenario:** Some images are low quality or incorrect

**Steps:**
1. Find the questionswith bad images
2. Click "Remove" on each
3. Optionally add better replacements
4. Export database
5. Update portals

**Result:** Poor images removed, database cleaned

---

## 📈 Statistics Tracking

The portal tracks:
- **Total Questions:** Never changes (120)
- **With Images:** Increases when you add, decreases when you remove
- **Modified:** Shows pending changes, resets after export

**Example Progression:**
```
Initial:  Total: 120, With Images: 36, Modified: 0
After 5 replacements: Total: 120, With Images: 36, Modified: 5
After adding 3 new: Total: 120, With Images: 39, Modified: 8
After removing 1: Total: 120, With Images: 38, Modified: 9
After export: Total: 120, With Images: 38, Modified: 0 (reset)
```

---

## 🔐 Security & Privacy

### **Data Handling:**
- All processing done **client-side** (in browser)
- No data sent to external servers
- Images stored in browser memory only
- Original files never modified

### **File Safety:**
- Export creates **new files**
- Original database preserved as backup
- No destructive operations
- Can always start over

---

## 📞 Support

### **Common Questions:**

**Q: Can I add multiple images per question?**
A: Not currently. Each question supports one image.

**Q: What happens to the old images?**
A: They remain in their original location. You can delete them manually if needed.

**Q: Can I edit the JSON directly?**
A: Yes, but using this portal is safer and easier.

**Q: How do I share images with other instructors?**
A: Export the database and share both the JSON file and the question_images folder.

**Q: Can I undo after exporting?**
A: No. Export creates permanent files. Keep the original JSON as backup.

---

## ✅ Checklist

Before exporting, verify:
- [ ] All desired images replaced
- [ ] Previews look correct
- [ ] Green dots on all modified questions
- [ ] Modified counter matches expectations
- [ ] Reviewed in lightbox (full-size)
- [ ] No pending undo operations needed

After exporting:
- [ ] All 3 files downloaded
- [ ] question_images folder created
- [ ] All images moved to folder
- [ ] Filenames match instructions
- [ ] Portal JavaScript updated
- [ ] Both portals tested
- [ ] Images display correctly

---

## 🎉 Summary

The Image Management Portal provides:
✅ Visual gallery of all questions
✅ Drag & drop image replacement
✅ Real-time preview
✅ Change tracking
✅ Safe export process
✅ Automatic file naming
✅ Clear instructions
✅ Easy deployment

**Status:** Production Ready
**Version:** 1.0
**Last Updated:** December 28, 2025

---

*For technical issues or feature requests, refer to the main project documentation.*
