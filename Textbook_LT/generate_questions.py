"""
Auto-generate nephropathology questions from extracted slide content
Uses existing questions as templates and combines with new content
"""

import json
import random
from datetime import datetime

print("=" * 70)
print("QUESTION GENERATION - Starting...")
print("=" * 70)
print()

# Load extracted content
print("Loading extracted content...")
with open('extracted_content/all_slides.json', 'r', encoding='utf-8') as f:
    slides = json.load(f)

with open('extracted_content/categorized_slides.json', 'r', encoding='utf-8') as f:
    categories = json.load(f)

with open('extracted_content/image_map.json', 'r', encoding='utf-8') as f:
    image_map = json.load(f)

# Load existing questions as templates
print("Loading existing questions...")
with open('../nephro_questions_bilingual.json', 'r', encoding='utf-8') as f:
    existing_data = json.load(f)
    existing_questions = existing_data['questions']

print(f"Existing questions: {len(existing_questions)}")
print()

# Question templates by type
templates = {
    'finding_mechanism': {
        'pattern': "DISEASE shows FINDING",
        'reason': "This is because MECHANISM",
        'difficulty': 'medium'
    },
    'diagnostic_feature': {
        'pattern': "The characteristic finding in DISEASE is FINDING",
        'reason': "This is pathognomonic/diagnostic for DISEASE",
        'difficulty': 'medium'
    },
    'em_vs_lm': {
        'pattern': "DISEASE shows FINDING on MODALITY",
        'reason': "The lesion is only visible on SPECIFIC_MODALITY",
        'difficulty': 'medium'
    },
    'if_pattern': {
        'pattern': "DISEASE demonstrates PATTERN on immunofluorescence",
        'reason': "This reflects MECHANISM of immune complex deposition",
        'difficulty': 'medium'
    }
}

# Content patterns to extract from slides
def extract_key_facts(slide_content):
    """Extract potential question content from slide text"""
    facts = []

    for text in slide_content.get('en_text', []):
        text_lower = text.lower()

        # Look for characteristic findings
        if any(word in text_lower for word in ['characteristic', 'typical', 'pathognomonic', 'diagnostic']):
            facts.append(('finding', text))

        # Look for mechanisms
        elif any(word in text_lower for word in ['because', 'due to', 'caused by', 'results from']):
            facts.append(('mechanism', text))

        # Look for microscopy descriptions
        elif any(word in text_lower for word in ['light microscopy', 'electron microscopy', 'immunofluorescence']):
            facts.append(('microscopy', text))

        # Look for clinical features
        elif any(word in text_lower for word in ['presents with', 'clinical', 'syndrome', 'proteinuria']):
            facts.append(('clinical', text))

    return facts

# Generate questions for each major topic
generated_questions = []
question_id = len(existing_questions) + 1

topics_to_generate = {
    'MCD': {'target': 10, 'disease_id': 'MCD'},
    'MGN': {'target': 8, 'disease_id': 'MGN'},
    'FSGS': {'target': 8, 'disease_id': 'FSGS_PRIMARY'},
    'IgAN': {'target': 6, 'disease_id': 'IgAN'},
    'DIABETIC': {'target': 4, 'disease_id': 'DIABETIC_GN'},
    'ANCA': {'target': 4, 'disease_id': 'ANCA_GN'},
    'GBM': {'target': 3, 'disease_id': 'ANTI_GBM'},
    'LUPUS': {'target': 3, 'disease_id': 'IC_RPGN'},
    'ALPORT': {'target': 3, 'disease_id': 'ALPORT'},
    'AMYLOID': {'target': 3, 'disease_id': 'AMYLOIDOSIS'},
    'IF': {'target': 5, 'disease_id': 'MGN'},  # General IF questions
    'EM': {'target': 3, 'disease_id': 'MCD'},  # General EM questions
}

print("Generating questions by topic...")
print("-" * 70)

for topic, config in topics_to_generate.items():
    topic_slides = categories.get(topic, [])
    if not topic_slides:
        continue

    target_count = config['target']
    disease_id = config['disease_id']

    generated_count = 0

    for slide_info in topic_slides[:target_count]:  # Limit per topic
        slide_num = slide_info['slide']
        slide_data = slides[slide_num - 1]

        en_text = slide_data.get('en_text', [])
        lt_text = slide_data.get('lt_text', [])

        if not en_text or not lt_text:
            continue

        # Get image if available
        image_path = None
        if str(slide_num) in image_map:
            images = image_map[str(slide_num)].get('images', [])
            if images:
                image_topic = image_map[str(slide_num)]['topic']
                image_path = f"extracted_images/{image_topic}/{images[0]}"

        # Create assertion from first substantive text
        assertion_en = en_text[0] if en_text else ""
        assertion_lt = lt_text[0] if lt_text else ""

        # Create reason from second text or elaborate on first
        reason_en = en_text[1] if len(en_text) > 1 else f"This finding is characteristic of the disease pathophysiology"
        reason_lt = lt_text[1] if len(lt_text) > 1 else f"Šis radinys būdingas ligos patofizologijai"

        # Skip if text is too short or too long
        if len(assertion_en.split()) < 5 or len(assertion_en.split()) > 50:
            continue

        # Create explanation
        explanation_en = ' '.join(en_text[:3]) if len(en_text) >= 3 else ' '.join(en_text)
        explanation_lt = ' '.join(lt_text[:3]) if len(lt_text) >= 3 else ' '.join(lt_text)

        # Determine answer (for now, default to A - both true and explains)
        answer = 'A'

        # Determine difficulty
        difficulty = 'medium'
        if 'electron microscopy' in assertion_en.lower() or 'ultrastructure' in assertion_en.lower():
            difficulty = 'hard'
        elif 'characteristic' in assertion_en.lower() or 'typical' in assertion_en.lower():
            difficulty = 'easy'

        question = {
            'id': question_id,
            'disease_id': disease_id,
            'topic': f"{topic}_slide{slide_num}",
            'difficulty': difficulty,
            'source_slide': slide_num,
            'en': {
                'assertion': assertion_en,
                'reason': reason_en,
                'answer': answer,
                'explanation': explanation_en
            },
            'lt': {
                'assertion': assertion_lt,
                'reason': reason_lt,
                'answer': answer,
                'explanation': explanation_lt
            }
        }

        if image_path:
            question['image'] = image_path

        generated_questions.append(question)
        question_id += 1
        generated_count += 1

        if generated_count >= target_count:
            break

    print(f"  {topic}: Generated {generated_count} questions")

print()
print(f"Total generated: {len(generated_questions)} questions")
print()

# Save generated questions
output_data = {
    'metadata': {
        'title': 'Generated Nephropathology Questions',
        'generated_date': datetime.now().isoformat(),
        'source': 'SlidesForSelfStudy_Nephropathology 2024',
        'total_questions': len(generated_questions),
        'method': 'Automated extraction from PowerPoint slides'
    },
    'questions': generated_questions
}

with open('generated_questions/new_questions.json', 'w', encoding='utf-8') as f:
    json.dump(output_data, f, indent=2, ensure_ascii=False)

print("Saved: generated_questions/new_questions.json")
print()

# Create preview file
preview = []
for q in generated_questions[:10]:
    preview.append({
        'id': q['id'],
        'topic': q['topic'],
        'difficulty': q['difficulty'],
        'assertion_en': q['en']['assertion'][:100] + '...' if len(q['en']['assertion']) > 100 else q['en']['assertion'],
        'has_image': 'image' in q
    })

with open('generated_questions/preview.json', 'w', encoding='utf-8') as f:
    json.dump(preview, f, indent=2, ensure_ascii=False)

print("Saved: generated_questions/preview.json")
print()

print("=" * 70)
print("GENERATION COMPLETE!")
print("=" * 70)
print()
print(f"Generated {len(generated_questions)} new questions")
print(f"With images: {sum(1 for q in generated_questions if 'image' in q)}")
print()
print("Next steps:")
print("1. Review: generated_questions/preview.json")
print("2. Full data: generated_questions/new_questions.json")
print("3. Merge with existing database")
print("=" * 70)
