# Nephropathology Question Generation Plan

## 📊 Source Materials:

### PowerPoint Presentations:
- **English:** SlidesForSelfStudy_Nephropathology_EN_2024.ppt (90 MB)
- **Lithuanian:** SlidesForSelfStudy_Nephropathology_LT_2024.ppt (86.2 MB)

### Lithuanian Textbook Chapters:
1. Greitai Progresuojantys Glomerulonefritai (RPGN)
2. Membraninė Nefropatija (MGN)
3. Membranoproliferaciniai Pokyčiai (MPGN)
4. Mezangioproliferaciniai Pokyčiai
5. Minimalūs Pokyčiai ir FSGS
6. Nefritinis Sindromas

---

## 🎯 Goals:

### 1. Generate More Questions
- Extract key concepts from slides
- Create assertion-reason format
- Bilingual (EN/LT) from matching slides
- Target: +50-100 new questions

### 2. Collect Image Illustrations
- Extract relevant microscopy images
- Diagram illustrations
- Clinical photos
- Associate with appropriate questions

---

## 📋 Process:

### Step 1: Convert PowerPoint Files ⏳
- Convert .ppt → .pptx (IN PROGRESS)
- Enable content extraction

### Step 2: Extract Slide Content
- Parse all slides from both presentations
- Match EN/LT slide pairs
- Extract text content
- Identify key teaching points

### Step 3: Extract Images
- Extract all images from slides
- Categorize by disease/topic
- Name systematically
- Save in organized folders

### Step 4: Generate Questions
- Identify assertion statements
- Create corresponding reasons
- Determine correct answer (A-E)
- Write explanations

### Step 5: Associate Images
- Link images to relevant questions
- Add image references to JSON
- Create image gallery structure

---

## 🏗️ Question Structure:

```json
{
  "id": 69,
  "disease_id": "IgAN",
  "topic": "IgAN_immunofluorescence",
  "difficulty": "medium",
  "image": "images/igan_mesangial_deposits.jpg",
  "en": {
    "assertion": "IgA nephropathy shows dominant mesangial IgA deposits on immunofluorescence",
    "reason": "IgA immune complexes deposit preferentially in the mesangial matrix",
    "answer": "A",
    "explanation": "IgAN is characterized by dominant or codominant mesangial IgA deposits..."
  },
  "lt": {
    "assertion": "IgA nefropatijoje imunofluorescencijoje matomi dominuojantys mezanginiai IgA nuos",
    "reason": "IgA imuniniai kompleksai kaupiasi pirmenybiškai mezanginiame matrikse",
    "answer": "A",
    "explanation": "IgAN būdingi dominuojantys ar lygiateisiai mezanginiai IgA nuosėdos..."
  }
}
```

---

## 📁 Image Organization:

```
images/
├── minimal_change_disease/
│   ├── mcd_em_foot_process_effacement.jpg
│   ├── mcd_light_microscopy_normal.jpg
├── fsgs/
│   ├── fsgs_sclerosis_segment.jpg
│   ├── fsgs_tip_lesion.jpg
├── mgn/
│   ├── mgn_spikes_silver_stain.jpg
│   ├── mgn_subepithelial_deposits.jpg
├── igan/
│   ├── igan_mesangial_proliferation.jpg
│   ├── igan_if_mesangial_iga.jpg
└── ... (other diseases)
```

---

## 🎓 Question Topics to Cover:

### From Current 68 Questions:
✓ Minimal Change Disease
✓ FSGS (Primary/Secondary)
✓ Membranous Glomerulopathy
✓ IgA Nephropathy
✓ ANCA-GN
✓ Anti-GBM Disease
✓ Diabetic Glomerulosclerosis
✓ Amyloidosis
✓ Alport Syndrome
✓ ATN/AIN
✓ Myeloma

### Additional Topics from Slides:
- Immunofluorescence patterns
- Electron microscopy findings
- Special stains interpretation
- Clinical-pathologic correlations
- Differential diagnosis scenarios
- Prognostic features
- Treatment implications

---

## 🔬 Image Categories:

1. **Light Microscopy**
   - H&E stains
   - PAS stains
   - Silver stains
   - Trichrome stains

2. **Immunofluorescence**
   - IgA, IgG, IgM patterns
   - C3, C4 patterns
   - Linear vs granular patterns

3. **Electron Microscopy**
   - Foot process effacement
   - Deposit locations
   - GBM abnormalities
   - Mesangial changes

4. **Diagrams**
   - Disease classifications
   - Pathogenesis flowcharts
   - Diagnostic algorithms

---

## ✅ Quality Control:

### For Questions:
- Medical accuracy verified
- Clear assertion-reason relationship
- Appropriate difficulty level
- Pedagogically sound
- No ambiguous wording

### For Images:
- High quality resolution
- Properly labeled
- Relevant to question
- Copyright cleared (educational use)

---

## 📊 Expected Output:

1. **Enhanced Question Database:**
   - Original 68 questions
   - +50-100 new questions
   - Total: ~120-170 questions

2. **Image Library:**
   - 100-200 medical images
   - Organized by disease
   - Linked to questions

3. **Updated JSON Structure:**
   - Image field added
   - Image metadata
   - Alternative text for accessibility

4. **Updated Portals:**
   - Image display capability
   - Zoom functionality
   - Image gallery view

---

## 🚀 Next Steps:

1. ⏳ Wait for .ppt → .pptx conversion
2. Extract slide content
3. Generate question drafts
4. Extract and organize images
5. Link images to questions
6. Update JSON database
7. Update portal interfaces
8. Test and verify

---

**Status:** Conversion in progress...
**Estimated Time:**
- Conversion: 2-3 minutes
- Content extraction: 10-15 minutes
- Question generation: 30-45 minutes
- Image organization: 20-30 minutes
**Total:** ~1.5-2 hours for complete enhancement
