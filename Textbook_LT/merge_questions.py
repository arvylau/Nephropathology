"""
Merge expanded questions with existing database
Create final enhanced question database with 120 total questions
"""

import json
from datetime import datetime

print("=" * 70)
print("MERGING QUESTIONS INTO FINAL DATABASE")
print("=" * 70)
print()

# Load existing questions
print("Loading existing questions...")
with open('../nephro_questions_bilingual.json', 'r', encoding='utf-8') as f:
    existing_data = json.load(f)
    existing_questions = existing_data['questions']
    existing_translations = existing_data.get('interface_translations', {})
    disease_translations = existing_data.get('disease_translations', {})

print(f"Existing questions: {len(existing_questions)}")

# Load new expanded questions
print("Loading new expanded questions...")
with open('generated_questions/expanded_questions.json', 'r', encoding='utf-8') as f:
    new_data = json.load(f)
    new_questions = new_data['questions']

print(f"New questions: {len(new_questions)}")
print()

# Combine questions
all_questions = existing_questions + new_questions
print(f"Total questions: {len(all_questions)}")
print()

# Create statistics
print("Statistics by disease:")
disease_counts = {}
for q in all_questions:
    disease_id = q.get('disease_id', 'UNKNOWN')
    disease_counts[disease_id] = disease_counts.get(disease_id, 0) + 1

for disease_id in sorted(disease_counts.keys()):
    disease_name_en = disease_translations.get(disease_id, {}).get('en', disease_id)
    count = disease_counts[disease_id]
    print(f"  {disease_name_en}: {count}")

print()
print(f"Questions with images: {sum(1 for q in all_questions if 'image' in q)}")
print()

# Difficulty distribution
difficulty_counts = {}
for q in all_questions:
    diff = q.get('difficulty', 'medium')
    difficulty_counts[diff] = difficulty_counts.get(diff, 0) + 1

print("Difficulty distribution:")
for diff in ['easy', 'medium', 'hard']:
    count = difficulty_counts.get(diff, 0)
    percentage = round(count / len(all_questions) * 100)
    print(f"  {diff.capitalize()}: {count} ({percentage}%)")

print()

# Create merged database
merged_data = {
    'metadata': {
        'title': 'Nephropathology Assessment - Enhanced Bilingual (EN/LT)',
        'languages': ['en', 'lt'],
        'total_questions': len(all_questions),
        'created': existing_data['metadata']['created'],
        'updated': datetime.now().isoformat(),
        'version': '4.0-enhanced-with-images',
        'translation_method': 'Google Translate with medical terminology preservation + manual editing',
        'enhancement_source': 'SlidesForSelfStudy_Nephropathology 2024',
        'questions_with_images': sum(1 for q in all_questions if 'image' in q),
        'generation_methods': [
            'Original manual creation (68 questions)',
            'PowerPoint extraction and curation (52 questions)'
        ]
    },
    'interface_translations': existing_translations,
    'disease_translations': disease_translations,
    'questions': all_questions
}

# Save merged database
output_path = '../nephro_questions_enhanced.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(merged_data, f, indent=2, ensure_ascii=False)

print(f"Saved enhanced database: {output_path}")
print()

# Create backup of original
import shutil
backup_path = '../nephro_questions_bilingual_backup.json'
shutil.copy('../nephro_questions_bilingual.json', backup_path)
print(f"Created backup: {backup_path}")
print()

print("=" * 70)
print("MERGE COMPLETE!")
print("=" * 70)
print()
print("Summary:")
print(f"  Original questions: {len(existing_questions)}")
print(f"  New questions: {len(new_questions)}")
print(f"  Total questions: {len(all_questions)}")
print(f"  Questions with images: {sum(1 for q in all_questions if 'image' in q)}")
print()
print("Files created:")
print(f"  - {output_path}")
print(f"  - {backup_path}")
print()
print("Next steps:")
print("  1. Review: nephro_questions_enhanced.json")
print("  2. Test with instructor portal")
print("  3. Test with student portal")
print("  4. Update portals to display images")
print()
print("=" * 70)
