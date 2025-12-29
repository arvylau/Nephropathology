"""
Image Migration Script
Moves images from Textbook_LT/extracted_images/ to question_images/
Renames to standard format: question_[ID].[ext]
Updates database with new paths
"""

import json
import os
import shutil
from pathlib import Path
from datetime import datetime

print("=" * 70)
print("IMAGE MIGRATION - Move to question_images folder")
print("=" * 70)
print()

# Paths
current_dir = Path(__file__).parent
db_path = current_dir / 'nephro_questions_enhanced.json'
old_images_base = current_dir / 'Textbook_LT' / 'extracted_images'
new_images_folder = current_dir / 'question_images'

# Create question_images folder if it doesn't exist
new_images_folder.mkdir(exist_ok=True)
print(f"[OK] Created/verified folder: {new_images_folder}")
print()

# Load database
print("Loading database...")
with open(db_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

questions = data['questions']
print(f"[OK] Loaded {len(questions)} questions")
print()

# Track statistics
migrated = 0
skipped = 0
errors = 0

print("Migrating images...")
print("-" * 70)

for question in questions:
    if 'image' not in question or not question['image']:
        continue

    old_path_rel = question['image']  # e.g., "extracted_images/MCD/MCD_slide13_img1.jpg"
    question_id = question['id']

    # Full path to old image
    old_path = current_dir / 'Textbook_LT' / old_path_rel

    # Check if old image exists
    if not old_path.exists():
        print(f"[SKIP] Question #{question_id}: Image not found - {old_path_rel}")
        skipped += 1
        continue

    # Get file extension
    extension = old_path.suffix  # e.g., ".jpg"

    # New standardized name
    new_filename = f"question_{question_id}{extension}"
    new_path = new_images_folder / new_filename

    try:
        # Copy image to new location
        shutil.copy2(old_path, new_path)

        # Update question with new path
        question['image'] = f"question_images/{new_filename}"

        print(f"[OK] Question #{question_id}: {old_path.name} -> {new_filename}")
        migrated += 1

    except Exception as e:
        print(f"[ERROR] Question #{question_id}: Error - {str(e)}")
        errors += 1

print()
print("=" * 70)
print("MIGRATION COMPLETE")
print("=" * 70)
print()
print(f"Statistics:")
print(f"  [OK] Migrated: {migrated} images")
print(f"  [SKIP] Skipped:  {skipped} (not found)")
print(f"  [ERROR] Errors:   {errors}")
print()

if migrated > 0:
    # Save updated database
    output_path = current_dir / 'nephro_questions_migrated.json'

    # Update metadata
    data['metadata']['updated'] = datetime.now().isoformat()
    data['metadata']['version'] = "4.2-migrated"
    data['metadata']['image_migration'] = {
        'migrated': migrated,
        'skipped': skipped,
        'errors': errors,
        'new_location': 'question_images/'
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"[OK] Saved updated database: {output_path.name}")
    print()
    print("Next steps:")
    print("  1. Review: question_images/ folder (contains all migrated images)")
    print("  2. Rename: nephro_questions_migrated.json → nephro_questions_enhanced.json")
    print("     (backup the old one first!)")
    print("  3. Test: Open both portals and verify images display")
    print("  4. Clean up: You can delete Textbook_LT/extracted_images/ if all works")
else:
    print("No images were migrated. Check the paths and try again.")

print()
print("=" * 70)
