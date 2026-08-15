/* ==========================================================================
   MODREN QUIZ COUNDECTER - Node.js Express REST API Server
   ========================================================================== */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Path references
const QUESTIONS_FILE = path.join(__dirname, 'data', 'questions.json');
const LEADERBOARD_FILE = path.join(__dirname, 'data', 'leaderboards.json');
const CERTIFICATES_FILE = path.join(__dirname, 'data', 'certificates.json');

// Helper to load JSON
function loadData(filePath, fallback = {}) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
      return fallback;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    return fallback;
  }
}

// Helper to save JSON
function saveData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`Error saving ${filePath}:`, e);
  }
}

// Ensure default leaderboards exist
function initDefaultLeaderboards() {
  const initialData = {
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
  };
  return loadData(LEADERBOARD_FILE, initialData);
}

// --------------------------------------------------------------------------
// API Routes
// --------------------------------------------------------------------------

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'MODREN QUIZ COUNDECTER REST API', timestamp: new Date() });
});

// 2. Auth Endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, name } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const displayName = (name && name.trim()) ? name.trim() : cleanEmail.split('@')[0];

  const user = {
    token: `token_${Date.now()}`,
    email: cleanEmail,
    name: displayName,
    initial: displayName.charAt(0).toUpperCase()
  };

  return res.json({ success: true, user });
});

// 3. Quiz Sampler Endpoint (Returns 50 MCQs)
app.get('/api/quiz/questions', (req, res) => {
  const subject = req.query.subject || 'ALL';
  const level = req.query.level || 'Hard';
  const count = parseInt(req.query.count) || 50;

  const basePool = loadData(QUESTIONS_FILE, []);
  let pool = basePool.filter(q => {
    const matchSubject = (subject === 'ALL' || q.subject === subject);
    const matchLevel = (level === 'ALL' || q.level === level);
    return matchSubject && matchLevel;
  });

  // Dynamic filler to ensure exact 50 questions
  const subjects = ["GK", "ENGLISH", "URDU", "SCIENCE", "SST", "MATH", "PST", "IQ"];
  let seed = pool.length + 1;

  while (pool.length < count * 2) {
    const sub = (subject === "ALL") ? subjects[pool.length % subjects.length] : subject;
    let proceduralQ = generateProceduralQuestion(sub, level, seed++);
    pool.push(proceduralQ);
  }

  // Shuffle pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const selected = pool.slice(0, count).map((q, idx) => ({
    id: `q_${idx + 1}`,
    num: idx + 1,
    subject: q.subject,
    level: q.level,
    question: q.question,
    options: q.options,
    answerIndex: q.answerIndex,
    isUrdu: !!q.isUrdu
  }));

  res.json({ success: true, count: selected.length, questions: selected });
});

// 4. 50/50 Hint Calculation Endpoint
app.post('/api/quiz/hint', (req, res) => {
  const { optionsCount, correctIndex } = req.body;
  if (optionsCount === undefined || correctIndex === undefined) {
    return res.status(400).json({ error: 'Missing parameter optionsCount or correctIndex' });
  }

  const wrongIndices = [];
  for (let i = 0; i < optionsCount; i++) {
    if (i !== correctIndex) wrongIndices.push(i);
  }

  // Shuffle wrong indices and pick 2
  for (let i = wrongIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [wrongIndices[i], wrongIndices[j]] = [wrongIndices[j], wrongIndices[i]];
  }

  const eliminated = wrongIndices.slice(0, 2);
  res.json({ success: true, eliminated });
});

// 5. Submit Exam Endpoint
app.post('/api/quiz/submit', (req, res) => {
  const { user, subject, level, questions, userAnswers, timeSpentSec } = req.body;

  if (!questions || !userAnswers) {
    return res.status(400).json({ error: 'Invalid submission data' });
  }

  let correctCount = 0;
  questions.forEach((q, idx) => {
    if (userAnswers[idx] === q.answerIndex) {
      correctCount++;
    }
  });

  const total = questions.length || 50;
  const percentage = Math.round((correctCount / total) * 100);
  const passed = percentage >= 60;
  const targetLevel = (level || 'Hard').toLowerCase();

  // Save score to level-specific leaderboard
  const leaderboards = initDefaultLeaderboards();
  if (!leaderboards[targetLevel]) leaderboards[targetLevel] = [];

  const candidateRecord = {
    name: user?.name || 'Candidate',
    email: user?.email || 'candidate@quiz.org',
    score: correctCount,
    percentage,
    timeSpentSec: timeSpentSec || 600,
    date: new Date().toISOString().split('T')[0]
  };

  leaderboards[targetLevel].push(candidateRecord);

  // Sort leaderboard by score DESC, timeSpentSec ASC
  leaderboards[targetLevel].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.timeSpentSec - b.timeSpentSec;
  });

  // Keep top 20
  leaderboards[targetLevel] = leaderboards[targetLevel].slice(0, 20);
  saveData(LEADERBOARD_FILE, leaderboards);

  // Determine Rank
  const rank = leaderboards[targetLevel].findIndex(item => 
    item.email === candidateRecord.email && 
    item.score === candidateRecord.score && 
    item.timeSpentSec === candidateRecord.timeSpentSec
  ) + 1 || 1;

  let certId = null;
  let certificate = null;

  if (passed) {
    certId = `MQC-${Math.floor(100000 + Math.random() * 900000)}`;
    certificate = {
      certificateId: certId,
      candidateName: user?.name || 'Candidate',
      candidateEmail: user?.email || 'candidate@quiz.org',
      level: level || 'Hard',
      subject: subject || 'ALL',
      score: `${correctCount} / ${total}`,
      percentage,
      rank: rank,
      message: `You just passed ${level || 'Hard'} level with top ${rank} position!`,
      issuedAt: new Date().toISOString()
    };

    const certStore = loadData(CERTIFICATES_FILE, {});
    certStore[certId] = certificate;
    saveData(CERTIFICATES_FILE, certStore);
  }

  res.json({
    success: true,
    result: {
      score: correctCount,
      total,
      percentage,
      passed,
      timeSpentSec: timeSpentSec || 600,
      rank,
      level: level || 'Hard',
      subject: subject || 'ALL',
      certificateId: certId,
      certificateMessage: certificate ? certificate.message : null
    }
  });
});

// 6. Level Leaderboard API Endpoint
app.get('/api/leaderboard/:level', (req, res) => {
  const level = (req.params.level || 'hard').toLowerCase();
  const leaderboards = initDefaultLeaderboards();
  const list = leaderboards[level] || [];
  res.json({ success: true, level, data: list });
});

// 7. Certificate Verification API Endpoint
app.get('/api/certificate/:id', (req, res) => {
  const certId = req.params.id;
  const certStore = loadData(CERTIFICATES_FILE, {});
  const cert = certStore[certId];
  if (!cert) {
    return res.status(404).json({ error: 'Certificate not found' });
  }
  res.json({ success: true, certificate: cert });
});

// Helper for procedural fallback generation
function generateProceduralQuestion(sub, lvl, seed) {
  if (sub === 'MATH') {
    const a = (seed * 7) % 30 + 5;
    const b = (seed * 3) % 15 + 2;
    const ans = a * b;
    return {
      subject: 'MATH', level: lvl,
      question: `Calculate the product of ${a} × ${b}:`,
      options: [ans.toString(), (ans + 4).toString(), (ans - 3).toString(), (ans + 10).toString()],
      answerIndex: 0
    };
  } else if (sub === 'IQ') {
    const start = (seed * 2) % 10 + 1;
    const step = 4;
    const nextVal = start + step * 4;
    return {
      subject: 'IQ', level: lvl,
      question: `Complete the numerical sequence: ${start}, ${start+step}, ${start+step*2}, ${start+step*3}, __?`,
      options: [nextVal.toString(), (nextVal + 2).toString(), (nextVal - 3).toString(), (nextVal + 5).toString()],
      answerIndex: 0
    };
  } else if (sub === 'URDU') {
    return {
      subject: 'URDU', level: lvl,
      question: 'علامہ اقبال کا سالِ پیدائش کیا ہے؟',
      options: ['1877ء', '1885ء', '1890ء', '1867ء'],
      answerIndex: 0,
      isUrdu: true
    };
  }
  return {
    subject: sub, level: lvl,
    question: `What is the fundamental law of ${sub} item #${seed}?`,
    options: ['Option A (Correct)', 'Option B', 'Option C', 'Option D'],
    answerIndex: 0
  };
}

// --------------------------------------------------------------------------
// ADMIN API Routes (password protected via X-Admin-Token header)
// --------------------------------------------------------------------------

const ADMIN_PASSWORD = 'admin123';

function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized: Invalid admin token' });
  }
  next();
}

// Admin Login Check
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    return res.json({ success: true, token: ADMIN_PASSWORD });
  }
  return res.status(401).json({ error: 'Invalid admin password' });
});

// Get all questions
app.get('/api/admin/questions', adminAuth, (req, res) => {
  const questions = loadData(QUESTIONS_FILE, []);
  res.json({ success: true, count: questions.length, questions });
});

// Add a new question
app.post('/api/admin/questions', adminAuth, (req, res) => {
  const { subject, level, question, options, answerIndex, isUrdu } = req.body;
  if (!subject || !level || !question || !options || answerIndex === undefined) {
    return res.status(400).json({ error: 'Missing required fields: subject, level, question, options, answerIndex' });
  }
  const questions = loadData(QUESTIONS_FILE, []);
  const newId = `q${Date.now()}`;
  const newQ = { id: newId, subject, level, question, options, answerIndex, isUrdu: !!isUrdu };
  questions.push(newQ);
  saveData(QUESTIONS_FILE, questions);
  res.json({ success: true, question: newQ });
});

// Update a question by ID
app.put('/api/admin/questions/:id', adminAuth, (req, res) => {
  const { id } = req.params;
  const questions = loadData(QUESTIONS_FILE, []);
  const idx = questions.findIndex(q => q.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Question not found' });
  const { subject, level, question, options, answerIndex, isUrdu } = req.body;
  questions[idx] = { ...questions[idx], subject, level, question, options, answerIndex, isUrdu: !!isUrdu };
  saveData(QUESTIONS_FILE, questions);
  res.json({ success: true, question: questions[idx] });
});

// Delete a question by ID
app.delete('/api/admin/questions/:id', adminAuth, (req, res) => {
  const { id } = req.params;
  let questions = loadData(QUESTIONS_FILE, []);
  const before = questions.length;
  questions = questions.filter(q => q.id !== id);
  if (questions.length === before) return res.status(404).json({ error: 'Question not found' });
  saveData(QUESTIONS_FILE, questions);
  res.json({ success: true, message: `Question ${id} deleted`, remaining: questions.length });
});

// Get all leaderboards
app.get('/api/admin/leaderboards', adminAuth, (req, res) => {
  const leaderboards = initDefaultLeaderboards();
  res.json({ success: true, leaderboards });
});

// Clear a specific leaderboard level
app.delete('/api/admin/leaderboards/:level', adminAuth, (req, res) => {
  const level = req.params.level.toLowerCase();
  const leaderboards = initDefaultLeaderboards();
  if (!leaderboards.hasOwnProperty(level)) return res.status(404).json({ error: 'Level not found' });
  leaderboards[level] = [];
  saveData(LEADERBOARD_FILE, leaderboards);
  res.json({ success: true, message: `Leaderboard for ${level} cleared` });
});

// Get all certificates
app.get('/api/admin/certificates', adminAuth, (req, res) => {
  const certStore = loadData(CERTIFICATES_FILE, {});
  const list = Object.values(certStore);
  res.json({ success: true, count: list.length, certificates: list });
});

// Delete a certificate by ID
app.delete('/api/admin/certificates/:id', adminAuth, (req, res) => {
  const { id } = req.params;
  const certStore = loadData(CERTIFICATES_FILE, {});
  if (!certStore[id]) return res.status(404).json({ error: 'Certificate not found' });
  delete certStore[id];
  saveData(CERTIFICATES_FILE, certStore);
  res.json({ success: true, message: `Certificate ${id} deleted` });
});

// Serve admin panel static file (frontend)
app.use('/admin', express.static(path.join(__dirname, '..', 'frontend')));

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  MODREN QUIZ COUNDECTER - Node.js Express Backend  `);
  console.log(`  Server running on http://localhost:${PORT}        `);
  console.log(`====================================================`);
});
