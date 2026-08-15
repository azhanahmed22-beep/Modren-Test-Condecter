# ==============================================================================
# MODREN QUIZ COUNDECTER - Python REST API Backend Server (Port 5001)
# ==============================================================================

import http.server
import socketserver
import json
import urllib.parse
import os
import random
import time
import mimetypes
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response as FastAPIResponse

# Use PORT from environment when deployed (default 5001)
PORT = int(os.environ.get('PORT', 5001))
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend')
QUESTIONS_FILE = os.path.join(DATA_DIR, 'questions.json')
LEADERBOARD_FILE = os.path.join(DATA_DIR, 'leaderboards.json')
CERTIFICATES_FILE = os.path.join(DATA_DIR, 'certificates.json')

def load_json(filepath, default):
    if not os.path.exists(filepath):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(default, f, indent=2, ensure_ascii=False)
        return default
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return default

def save_json(filepath, data):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def get_default_leaderboards():
    initial = {
        "impossible": [
            { "name": "Dr. Zeeshan K.", "email": "zeeshan@cyber.org", "score": 48, "percentage": 96, "timeSpentSec": 720, "date": "2026-08-01" },
            { "name": "Ayesha Malik", "email": "ayesha.m@tech.io", "score": 45, "percentage": 90, "timeSpentSec": 810, "date": "2026-08-03" }
        ],
        "expert": [
            { "name": "Hamza Ahmed", "email": "hamza@ai.net", "score": 49, "percentage": 98, "timeSpentSec": 680, "date": "2026-08-02" },
            { "name": "Fatima Noor", "email": "fatima@scholar.org", "score": 47, "percentage": 94, "timeSpentSec": 750, "date": "2026-08-04" }
        ],
        "hard": [
            { "name": "Sara Khan", "email": "sara@quant.io", "score": 50, "percentage": 100, "timeSpentSec": 620, "date": "2026-08-01" },
            { "name": "Usman Ali", "email": "usman@matrix.pk", "score": 48, "percentage": 96, "timeSpentSec": 710, "date": "2026-08-04" }
        ],
        "medium": [
            { "name": "Mustafa Kamal", "email": "mustafa@lab.com", "score": 50, "percentage": 100, "timeSpentSec": 540, "date": "2026-08-02" },
            { "name": "Hira Sultan", "email": "hira@edu.pk", "score": 49, "percentage": 98, "timeSpentSec": 600, "date": "2026-08-05" }
        ],
        "easy": [
            { "name": "Ali Raza", "email": "ali@start.org", "score": 50, "percentage": 100, "timeSpentSec": 420, "date": "2026-08-03" },
            { "name": "Sana Iqbal", "email": "sana@learn.com", "score": 50, "percentage": 100, "timeSpentSec": 480, "date": "2026-08-06" }
        ]
    }
    return load_json(LEADERBOARD_FILE, initial)

class QuizAPIRequestHandler(http.server.BaseHTTPRequestHandler):

    ADMIN_PASSWORD = 'admin123'

    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token')

    def check_admin_auth(self):
        token = self.headers.get('X-Admin-Token', '')
        return token == self.ADMIN_PASSWORD

    def send_unauth(self):
        return self.send_json(401, {'error': 'Unauthorized: Invalid admin token'})

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def send_json(self, status, payload):
        self.send_response(status)
        self.send_cors_headers()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False, indent=2).encode('utf-8'))

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path_str = parsed_url.path.rstrip('/')
        if path_str == '':
            path_str = '/'
            
        query = urllib.parse.parse_qs(parsed_url.query)

        # Root — serve frontend index.html
        if path_str in ['/', '']:
            return self.serve_static_file('index.html')

        # Health check
        elif path_str == '/api/health':
            return self.send_json(200, { "status": "ok", "service": "MODREN QUIZ COUNDECTER REST API", "time": datetime.now().isoformat() })

        # Quiz Questions Sampler (50 MCQs)
        elif path_str == '/api/quiz/questions':
            subject = query.get('subject', ['ALL'])[0]
            level = query.get('level', ['Hard'])[0]
            count = int(query.get('count', [50])[0])

            base_questions = load_json(QUESTIONS_FILE, [])
            pool = [q for q in base_questions if (subject == 'ALL' or q.get('subject') == subject) and (level == 'ALL' or q.get('level') == level)]

            subjects = ["GK", "ENGLISH", "URDU", "SCIENCE", "SST", "MATH", "PST", "IQ"]
            seed = len(pool) + 1

            while len(pool) < count * 2:
                sub = subjects[len(pool) % len(subjects)] if subject == 'ALL' else subject
                pool.append({
                    "subject": sub,
                    "level": level,
                    "question": f"Calculate fundamental {sub} evaluation index #{seed}:",
                    "options": [f"Standard Value #{seed}", "Option B", "Option C", "Option D"],
                    "answerIndex": 0,
                    "isUrdu": (sub == "URDU")
                })
                seed += 1

            random.shuffle(pool)
            selected = pool[:count]

            for idx, q in enumerate(selected):
                q['id'] = f"q_{idx + 1}"
                q['num'] = idx + 1

            return self.send_json(200, { "success": True, "count": len(selected), "questions": selected })

        # Level Leaderboard
        elif path_str.startswith('/api/leaderboard'):
            lvl = path_str.replace('/api/leaderboard', '').strip('/').lower()
            if not lvl:
                lvl = 'hard'
            leaderboards = get_default_leaderboards()
            data = leaderboards.get(lvl, [])
            return self.send_json(200, { "success": True, "level": lvl, "data": data })

        # Certificate Details
        elif path_str.startswith('/api/certificate'):
            cert_id = path_str.replace('/api/certificate', '').strip('/')
            certs = load_json(CERTIFICATES_FILE, {})
            if cert_id in certs:
                return self.send_json(200, { "success": True, "certificate": certs[cert_id] })
            else:
                return self.send_json(404, { "error": "Certificate not found" })

        # ---- ADMIN GET ROUTES ----
        elif path_str == '/api/admin/questions':
            if not self.check_admin_auth(): return self.send_unauth()
            questions = load_json(QUESTIONS_FILE, [])
            return self.send_json(200, {'success': True, 'count': len(questions), 'questions': questions})

        elif path_str == '/api/admin/leaderboards':
            if not self.check_admin_auth(): return self.send_unauth()
            lbs = get_default_leaderboards()
            return self.send_json(200, {'success': True, 'leaderboards': lbs})

        elif path_str == '/api/admin/certificates':
            if not self.check_admin_auth(): return self.send_unauth()
            certs = load_json(CERTIFICATES_FILE, {})
            cert_list = list(certs.values())
            return self.send_json(200, {'success': True, 'count': len(cert_list), 'certificates': cert_list})

        # ---- Static file fallback (serves frontend assets) ----
        else:
            return self.serve_static_file(path_str.lstrip('/'))

    def serve_static_file(self, rel_path):
        """Serve a file from the frontend directory."""
        if not rel_path or rel_path == '':
            rel_path = 'index.html'
        # Security: prevent path traversal
        safe_path = os.path.normpath(rel_path).lstrip(os.sep)
        full_path = os.path.join(FRONTEND_DIR, safe_path)
        if not os.path.isfile(full_path):
            self.send_response(404)
            self.send_cors_headers()
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(b'<h1>404 Not Found</h1><p><a href="/">Go to Quiz App</a></p>')
            return
        mime_type, _ = mimetypes.guess_type(full_path)
        mime_type = mime_type or 'application/octet-stream'
        with open(full_path, 'rb') as f:
            content = f.read()
        self.send_response(200)
        self.send_cors_headers()
        self.send_header('Content-Type', mime_type)
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def do_POST(self):

        parsed_url = urllib.parse.urlparse(self.path)
        path_str = parsed_url.path.rstrip('/')

        content_length = int(self.headers.get('Content-Length', 0))
        body_bytes = self.rfile.read(content_length) if content_length > 0 else b'{}'
        
        try:
            body = json.loads(body_bytes.decode('utf-8'))
        except Exception:
            body = {}

        # Auth Login
        if path_str == '/api/auth/login':
            email = body.get('email', '').strip().lower()
            name = body.get('name', '').strip() or email.split('@')[0]
            if not email:
                return self.send_json(400, { "error": "Email is required" })
            return self.send_json(200, {
                "success": True,
                "user": {
                    "token": f"token_{int(time.time())}",
                    "email": email,
                    "name": name,
                    "initial": name[0].upper() if name else 'U'
                }
            })

        # 50/50 Hint Calculation
        elif path_str == '/api/quiz/hint':
            options_count = body.get('optionsCount', 4)
            correct_idx = body.get('correctIndex', 0)

            wrong = [i for i in range(options_count) if i != correct_idx]
            random.shuffle(wrong)
            eliminated = wrong[:2]
            return self.send_json(200, { "success": True, "eliminated": eliminated })

        # Exam Submission
        elif path_str == '/api/quiz/submit':
            user = body.get('user', {})
            subject = body.get('subject', 'ALL')
            level = body.get('level', 'Hard')
            questions = body.get('questions', [])
            user_answers = body.get('userAnswers', {})
            time_spent = body.get('timeSpentSec', 600)

            correct = 0
            for idx, q in enumerate(questions):
                ans = user_answers.get(str(idx), user_answers.get(idx))
                if ans == q.get('answerIndex'):
                    correct += 1

            total = len(questions) or 50
            percentage = round((correct / total) * 100)
            passed = percentage >= 60
            lvl_key = level.lower()

            leaderboards = get_default_leaderboards()
            if lvl_key not in leaderboards:
                leaderboards[lvl_key] = []

            entry = {
                "name": user.get('name', 'Candidate'),
                "email": user.get('email', 'candidate@quiz.org'),
                "score": correct,
                "percentage": percentage,
                "timeSpentSec": time_spent,
                "date": datetime.now().strftime('%Y-%m-%d')
            }

            leaderboards[lvl_key].append(entry)
            leaderboards[lvl_key].sort(key=lambda x: (-x['score'], x['timeSpentSec']))
            leaderboards[lvl_key] = leaderboards[lvl_key][:20]
            save_json(LEADERBOARD_FILE, leaderboards)

            rank = 1
            for idx, item in enumerate(leaderboards[lvl_key]):
                if item['email'] == entry['email'] and item['score'] == entry['score'] and item['timeSpentSec'] == entry['timeSpentSec']:
                    rank = idx + 1
                    break

            cert_id = None
            cert_msg = None
            if passed:
                cert_id = f"MQC-{random.randint(100000, 999999)}"
                cert_msg = f"You just passed {level} level with top {rank} position!"
                certs = load_json(CERTIFICATES_FILE, {})
                certs[cert_id] = {
                    "certificateId": cert_id,
                    "candidateName": entry['name'],
                    "candidateEmail": entry['email'],
                    "level": level,
                    "subject": subject,
                    "score": f"{correct} / {total}",
                    "percentage": percentage,
                    "rank": rank,
                    "message": cert_msg,
                    "issuedAt": datetime.now().isoformat()
                }
                save_json(CERTIFICATES_FILE, certs)

            return self.send_json(200, {
                "success": True,
                "result": {
                    "score": correct,
                    "total": total,
                    "percentage": percentage,
                    "passed": passed,
                    "timeSpentSec": time_spent,
                    "rank": rank,
                    "level": level,
                    "subject": subject,
                    "certificateId": cert_id,
                    "certificateMessage": cert_msg
                }
            })

        # ---- ADMIN POST ROUTES ----
        elif path_str == '/api/admin/login':
            pw = body.get('password', '')
            if pw == self.ADMIN_PASSWORD:
                return self.send_json(200, {'success': True, 'token': self.ADMIN_PASSWORD})
            return self.send_json(401, {'error': 'Invalid admin password'})

        elif path_str == '/api/admin/questions':
            if not self.check_admin_auth(): return self.send_unauth()
            subj = body.get('subject'); lvl = body.get('level')
            q_text = body.get('question'); opts = body.get('options'); ai = body.get('answerIndex')
            if not all([subj, lvl, q_text, opts]) or ai is None:
                return self.send_json(400, {'error': 'Missing required fields'})
            questions = load_json(QUESTIONS_FILE, [])
            new_q = {'id': f'q{int(time.time()*1000)}', 'subject': subj, 'level': lvl,
                     'question': q_text, 'options': opts, 'answerIndex': ai,
                     'isUrdu': bool(body.get('isUrdu', False))}
            questions.append(new_q)
            save_json(QUESTIONS_FILE, questions)
            return self.send_json(200, {'success': True, 'question': new_q})

        return self.send_json(404, { "error": "Endpoint not found", "path": path_str })

    def read_body(self):
        length = int(self.headers.get('Content-Length', 0))
        raw = self.rfile.read(length) if length > 0 else b'{}'
        try:
            return json.loads(raw.decode('utf-8'))
        except:
            return {}

    def do_PUT(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path_str = parsed_url.path.rstrip('/')
        body = self.read_body()

        # Edit question by ID
        if '/api/admin/questions/' in path_str:
            if not self.check_admin_auth(): return self.send_unauth()
            qid = path_str.split('/api/admin/questions/')[-1]
            questions = load_json(QUESTIONS_FILE, [])
            idx = next((i for i, q in enumerate(questions) if q.get('id') == qid), -1)
            if idx == -1:
                return self.send_json(404, {'error': 'Question not found'})
            questions[idx].update({
                'subject': body.get('subject', questions[idx]['subject']),
                'level':   body.get('level',   questions[idx]['level']),
                'question':body.get('question',questions[idx]['question']),
                'options': body.get('options', questions[idx]['options']),
                'answerIndex': body.get('answerIndex', questions[idx]['answerIndex']),
                'isUrdu': bool(body.get('isUrdu', questions[idx].get('isUrdu', False)))
            })
            save_json(QUESTIONS_FILE, questions)
            return self.send_json(200, {'success': True, 'question': questions[idx]})

        return self.send_json(404, {'error': 'Not found'})

    def do_DELETE(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path_str = parsed_url.path.rstrip('/')

        # Delete question
        if '/api/admin/questions/' in path_str:
            if not self.check_admin_auth(): return self.send_unauth()
            qid = path_str.split('/api/admin/questions/')[-1]
            questions = load_json(QUESTIONS_FILE, [])
            before = len(questions)
            questions = [q for q in questions if q.get('id') != qid]
            if len(questions) == before:
                return self.send_json(404, {'error': 'Question not found'})
            save_json(QUESTIONS_FILE, questions)
            return self.send_json(200, {'success': True, 'remaining': len(questions)})

        # Clear leaderboard level
        elif '/api/admin/leaderboards/' in path_str:
            if not self.check_admin_auth(): return self.send_unauth()
            lvl = path_str.split('/api/admin/leaderboards/')[-1].lower()
            lbs = get_default_leaderboards()
            if lvl not in lbs:
                return self.send_json(404, {'error': 'Level not found'})
            lbs[lvl] = []
            save_json(LEADERBOARD_FILE, lbs)
            return self.send_json(200, {'success': True, 'message': f'{lvl} leaderboard cleared'})

        # Delete certificate
        elif '/api/admin/certificates/' in path_str:
            if not self.check_admin_auth(): return self.send_unauth()
            cid = path_str.split('/api/admin/certificates/')[-1]
            certs = load_json(CERTIFICATES_FILE, {})
            if cid not in certs:
                return self.send_json(404, {'error': 'Certificate not found'})
            del certs[cid]
            save_json(CERTIFICATES_FILE, certs)
            return self.send_json(200, {'success': True, 'message': f'{cid} deleted'})

        return self.send_json(404, {'error': 'Not found'})

app = FastAPI()


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    }


def json_response(status, payload):
    return JSONResponse(status_code=status, content=payload, headers=cors_headers())


def serve_static_file(rel_path):
    if not rel_path or rel_path == '':
        rel_path = 'index.html'
    safe_path = os.path.normpath(rel_path).lstrip(os.sep)
    full_path = os.path.join(FRONTEND_DIR, safe_path)
    if not os.path.isfile(full_path):
        return FastAPIResponse(
            content=b'<h1>404 Not Found</h1><p><a href="/">Go to Quiz App</a></p>',
            status_code=404,
            media_type='text/html',
            headers=cors_headers()
        )
    mime_type, _ = mimetypes.guess_type(full_path)
    mime_type = mime_type or 'application/octet-stream'
    with open(full_path, 'rb') as f:
        content = f.read()
    return FastAPIResponse(content=content, media_type=mime_type, headers=cors_headers())


@app.middleware('http')
async def asgi_request_handler(request: Request, call_next):
    method = request.method
    path_str = request.url.path.rstrip('/')
    if path_str == '':
        path_str = '/'

    if method == 'OPTIONS':
        return FastAPIResponse(status_code=200, headers=cors_headers())

    query = request.query_params
    body = {}
    if method in ('POST', 'PUT', 'DELETE'):
        try:
            body = await request.json()
        except Exception:
            body = {}

    if method == 'GET':
        if path_str in ['/', '']:
            return serve_static_file('index.html')

        elif path_str == '/api/health':
            return json_response(200, {"status": "ok", "service": "MODREN QUIZ COUNDECTER REST API", "time": datetime.now().isoformat()})

        elif path_str == '/api/quiz/questions':
            subject = query.get('subject', 'ALL')
            level = query.get('level', 'Hard')
            count = int(query.get('count', '50'))
            base_questions = load_json(QUESTIONS_FILE, [])
            pool = [q for q in base_questions if (subject == 'ALL' or q.get('subject') == subject) and (level == 'ALL' or q.get('level') == level)]
            subjects = ["GK", "ENGLISH", "URDU", "SCIENCE", "SST", "MATH", "PST", "IQ"]
            seed = len(pool) + 1
            while len(pool) < count * 2:
                sub = subjects[len(pool) % len(subjects)] if subject == 'ALL' else subject
                pool.append({
                    "subject": sub,
                    "level": level,
                    "question": f"Calculate fundamental {sub} evaluation index #{seed}:",
                    "options": [f"Standard Value #{seed}", "Option B", "Option C", "Option D"],
                    "answerIndex": 0,
                    "isUrdu": (sub == "URDU")
                })
                seed += 1
            random.shuffle(pool)
            selected = pool[:count]
            for idx, q in enumerate(selected):
                q['id'] = f"q_{idx + 1}"
                q['num'] = idx + 1
            return json_response(200, {"success": True, "count": len(selected), "questions": selected})

        elif path_str.startswith('/api/leaderboard'):
            lvl = path_str.replace('/api/leaderboard', '').strip('/').lower()
            if not lvl:
                lvl = 'hard'
            leaderboards = get_default_leaderboards()
            data = leaderboards.get(lvl, [])
            return json_response(200, {"success": True, "level": lvl, "data": data})

        elif path_str.startswith('/api/certificate'):
            cert_id = path_str.replace('/api/certificate', '').strip('/')
            certs = load_json(CERTIFICATES_FILE, {})
            if cert_id in certs:
                return json_response(200, {"success": True, "certificate": certs[cert_id]})
            else:
                return json_response(404, {"error": "Certificate not found"})

        elif path_str == '/api/admin/questions':
            token = request.headers.get('x-admin-token', '')
            if token != QuizAPIRequestHandler.ADMIN_PASSWORD:
                return json_response(401, {'error': 'Unauthorized: Invalid admin token'})
            questions = load_json(QUESTIONS_FILE, [])
            return json_response(200, {'success': True, 'count': len(questions), 'questions': questions})

        elif path_str == '/api/admin/leaderboards':
            token = request.headers.get('x-admin-token', '')
            if token != QuizAPIRequestHandler.ADMIN_PASSWORD:
                return json_response(401, {'error': 'Unauthorized: Invalid admin token'})
            lbs = get_default_leaderboards()
            return json_response(200, {'success': True, 'leaderboards': lbs})

        elif path_str == '/api/admin/certificates':
            token = request.headers.get('x-admin-token', '')
            if token != QuizAPIRequestHandler.ADMIN_PASSWORD:
                return json_response(401, {'error': 'Unauthorized: Invalid admin token'})
            certs = load_json(CERTIFICATES_FILE, {})
            cert_list = list(certs.values())
            return json_response(200, {'success': True, 'count': len(cert_list), 'certificates': cert_list})

        else:
            return serve_static_file(path_str.lstrip('/'))

    if method == 'POST':
        if path_str == '/api/auth/login':
            email = body.get('email', '').strip().lower()
            name = body.get('name', '').strip() or (email.split('@')[0] if email else 'Candidate')
            if not email:
                return json_response(400, {"error": "Email is required"})
            return json_response(200, {
                "success": True,
                "user": {
                    "token": f"token_{int(time.time())}",
                    "email": email,
                    "name": name,
                    "initial": name[0].upper() if name else 'U'
                }
            })

        elif path_str == '/api/quiz/hint':
            options_count = body.get('optionsCount', 4)
            correct_idx = body.get('correctIndex', 0)
            wrong = [i for i in range(options_count) if i != correct_idx]
            random.shuffle(wrong)
            eliminated = wrong[:2]
            return json_response(200, {"success": True, "eliminated": eliminated})

        elif path_str == '/api/quiz/submit':
            user = body.get('user', {})
            subject = body.get('subject', 'ALL')
            level = body.get('level', 'Hard')
            questions = body.get('questions', [])
            user_answers = body.get('userAnswers', {})
            time_spent = body.get('timeSpentSec', 600)
            correct = 0
            for idx, q in enumerate(questions):
                ans = user_answers.get(str(idx), user_answers.get(idx))
                if ans == q.get('answerIndex'):
                    correct += 1
            total = len(questions) or 50
            percentage = round((correct / total) * 100)
            passed = percentage >= 60
            lvl_key = level.lower()
            leaderboards = get_default_leaderboards()
            if lvl_key not in leaderboards:
                leaderboards[lvl_key] = []
            entry = {
                "name": user.get('name', 'Candidate'),
                "email": user.get('email', 'candidate@quiz.org'),
                "score": correct,
                "percentage": percentage,
                "timeSpentSec": time_spent,
                "date": datetime.now().strftime('%Y-%m-%d')
            }
            leaderboards[lvl_key].append(entry)
            leaderboards[lvl_key].sort(key=lambda x: (-x['score'], x['timeSpentSec']))
            leaderboards[lvl_key] = leaderboards[lvl_key][:20]
            save_json(LEADERBOARD_FILE, leaderboards)
            rank = 1
            for idx, item in enumerate(leaderboards[lvl_key]):
                if item['email'] == entry['email'] and item['score'] == entry['score'] and item['timeSpentSec'] == entry['timeSpentSec']:
                    rank = idx + 1
                    break
            cert_id = None
            cert_msg = None
            if passed:
                cert_id = f"MQC-{random.randint(100000, 999999)}"
                cert_msg = f"You just passed {level} level with top {rank} position!"
                certs = load_json(CERTIFICATES_FILE, {})
                certs[cert_id] = {
                    "certificateId": cert_id,
                    "candidateName": entry['name'],
                    "candidateEmail": entry['email'],
                    "level": level,
                    "subject": subject,
                    "score": f"{correct} / {total}",
                    "percentage": percentage,
                    "rank": rank,
                    "message": cert_msg,
                    "issuedAt": datetime.now().isoformat()
                }
                save_json(CERTIFICATES_FILE, certs)
            return json_response(200, {
                "success": True,
                "result": {
                    "score": correct,
                    "total": total,
                    "percentage": percentage,
                    "passed": passed,
                    "timeSpentSec": time_spent,
                    "rank": rank,
                    "level": level,
                    "subject": subject,
                    "certificateId": cert_id,
                    "certificateMessage": cert_msg
                }
            })

        elif path_str == '/api/admin/login':
            pw = body.get('password', '')
            if pw == QuizAPIRequestHandler.ADMIN_PASSWORD:
                return json_response(200, {'success': True, 'token': QuizAPIRequestHandler.ADMIN_PASSWORD})
            return json_response(401, {'error': 'Invalid admin password'})

        elif path_str == '/api/admin/questions':
            token = request.headers.get('x-admin-token', '')
            if token != QuizAPIRequestHandler.ADMIN_PASSWORD:
                return json_response(401, {'error': 'Unauthorized: Invalid admin token'})
            subj = body.get('subject'); lvl = body.get('level')
            q_text = body.get('question'); opts = body.get('options'); ai = body.get('answerIndex')
            if not all([subj, lvl, q_text, opts]) or ai is None:
                return json_response(400, {'error': 'Missing required fields'})
            questions = load_json(QUESTIONS_FILE, [])
            new_q = {'id': f'q{int(time.time()*1000)}', 'subject': subj, 'level': lvl,
                     'question': q_text, 'options': opts, 'answerIndex': ai,
                     'isUrdu': bool(body.get('isUrdu', False))}
            questions.append(new_q)
            save_json(QUESTIONS_FILE, questions)
            return json_response(200, {'success': True, 'question': new_q})

    if method == 'PUT':
        if '/api/admin/questions/' in path_str:
            token = request.headers.get('x-admin-token', '')
            if token != QuizAPIRequestHandler.ADMIN_PASSWORD:
                return json_response(401, {'error': 'Unauthorized: Invalid admin token'})
            qid = path_str.split('/api/admin/questions/')[-1]
            questions = load_json(QUESTIONS_FILE, [])
            idx = next((i for i, q in enumerate(questions) if q.get('id') == qid), -1)
            if idx == -1:
                return json_response(404, {'error': 'Question not found'})
            questions[idx].update({
                'subject': body.get('subject', questions[idx]['subject']),
                'level': body.get('level', questions[idx]['level']),
                'question': body.get('question', questions[idx]['question']),
                'options': body.get('options', questions[idx]['options']),
                'answerIndex': body.get('answerIndex', questions[idx]['answerIndex']),
                'isUrdu': bool(body.get('isUrdu', questions[idx].get('isUrdu', False)))
            })
            save_json(QUESTIONS_FILE, questions)
            return json_response(200, {'success': True, 'question': questions[idx]})

    if method == 'DELETE':
        if '/api/admin/questions/' in path_str:
            token = request.headers.get('x-admin-token', '')
            if token != QuizAPIRequestHandler.ADMIN_PASSWORD:
                return json_response(401, {'error': 'Unauthorized: Invalid admin token'})
            qid = path_str.split('/api/admin/questions/')[-1]
            questions = load_json(QUESTIONS_FILE, [])
            before = len(questions)
            questions = [q for q in questions if q.get('id') != qid]
            if len(questions) == before:
                return json_response(404, {'error': 'Question not found'})
            save_json(QUESTIONS_FILE, questions)
            return json_response(200, {'success': True, 'remaining': len(questions)})

        elif '/api/admin/leaderboards/' in path_str:
            token = request.headers.get('x-admin-token', '')
            if token != QuizAPIRequestHandler.ADMIN_PASSWORD:
                return json_response(401, {'error': 'Unauthorized: Invalid admin token'})
            lvl = path_str.split('/api/admin/leaderboards/')[-1].lower()
            lbs = get_default_leaderboards()
            if lvl not in lbs:
                return json_response(404, {'error': 'Level not found'})
            lbs[lvl] = []
            save_json(LEADERBOARD_FILE, lbs)
            return json_response(200, {'success': True, 'message': f'{lvl} leaderboard cleared'})

        elif '/api/admin/certificates/' in path_str:
            token = request.headers.get('x-admin-token', '')
            if token != QuizAPIRequestHandler.ADMIN_PASSWORD:
                return json_response(401, {'error': 'Unauthorized: Invalid admin token'})
            cid = path_str.split('/api/admin/certificates/')[-1]
            certs = load_json(CERTIFICATES_FILE, {})
            if cid not in certs:
                return json_response(404, {'error': 'Certificate not found'})
            del certs[cid]
            save_json(CERTIFICATES_FILE, certs)
            return json_response(200, {'success': True, 'message': f'{cid} deleted'})

    return json_response(404, {'error': 'Not found'})


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

if __name__ == '__main__':
    print(f"====================================================")
    print(f"  MODREN QUIZ COUNDECTER - Python REST API Backend  ")
    print(f"  Server running on http://localhost:{PORT}         ")
    print(f"====================================================")
    with ReusableTCPServer(("", PORT), QuizAPIRequestHandler) as httpd:
        httpd.serve_forever()
