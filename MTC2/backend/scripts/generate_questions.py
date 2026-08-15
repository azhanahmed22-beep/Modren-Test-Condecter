import json
import os
import random
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'data', 'questions.json')

SUBJECTS = ["GK", "ENGLISH", "URDU", "SCIENCE", "SST", "MATH", "PST", "IQ"]
LEVELS = ["Easy", "Medium", "Hard", "Expert", "Impossible"]
TARGET_PER_COMBINATION = 50

def load_questions():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_questions(qs):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(qs, f, ensure_ascii=False, indent=2)

def generate_question(subject, level, seq):
    qid = f"auto_{subject}_{level}_{seq}_{int(datetime.utcnow().timestamp())}"
    if subject == 'GK':
        question = f"General knowledge item {seq} about {level} level." 
        options = ["Option A", "Option B", "Option C", "Option D"]
    elif subject == 'ENGLISH':
        question = f"Choose the best English usage example #{seq}."
        options = ["Correct usage", "Plausible wrong", "Wrong form", "Nonsense"]
    elif subject == 'URDU':
        question = f"یہ اردو سوال نمبر {seq} ({level}) ہے۔"
        options = ["اختیار A", "اختیار B", "اختیار C", "اختیار D"]
    elif subject == 'SCIENCE':
        question = f"Science question #{seq}: which statement best fits?"
        options = ["True fact", "Common misconception", "Irrelevant", "Distractor"]
    elif subject == 'SST':
        question = f"Social studies question #{seq} about geography/history."
        options = ["Answer 1", "Answer 2", "Answer 3", "Answer 4"]
    elif subject == 'MATH':
        a = seq + 2
        b = seq + 3
        ans = a * b
        question = f"Calculate: {a} × {b} = ?"
        options = [str(ans), str(ans+1), str(ans-1), str(ans+5)]
    elif subject == 'PST':
        question = f"Pakistan studies item #{seq} ({level})."
        options = ["Option 1", "Option 2", "Option 3", "Option 4"]
    elif subject == 'IQ':
        start = seq % 10 + 1
        step = 2
        correct = start + step * 4
        question = f"Complete the sequence: {start}, {start+step}, {start+step*2}, {start+step*3}, __?"
        options = [str(correct), str(correct+2), str(correct-1), str(correct+5)]
    else:
        question = f"Generic question {seq} for {subject}"
        options = ["A","B","C","D"]

    answerIndex = 0
    q = {
        "id": qid,
        "subject": subject,
        "level": level,
        "question": question,
        "options": options,
        "answerIndex": answerIndex
    }
    if subject == 'URDU':
        q['isUrdu'] = True
    return q

def main():
    random.seed(42)
    qs = load_questions()
    # Group existing counts
    counts = {}
    for s in SUBJECTS:
        for l in LEVELS:
            counts[(s,l)] = 0
    for q in qs:
        key = (q.get('subject'), q.get('level'))
        if key in counts:
            counts[key] += 1

    added = 0
    for s in SUBJECTS:
        for l in LEVELS:
            have = counts[(s,l)]
            need = TARGET_PER_COMBINATION - have
            if need <= 0:
                continue
            start_seq = have + 1
            for i in range(need):
                seq = start_seq + i
                newq = generate_question(s, l, seq)
                qs.append(newq)
                added += 1

    save_questions(qs)
    print(f"Added {added} questions. Total now: {len(qs)}")

if __name__ == '__main__':
    main()
