/* ==========================================================================
   MODREN QUIZ COUNDECTER - Frontend Quiz Arena Engine
   Integrates with Express Backend REST API
   ========================================================================== */

class QuizEngine {
  constructor() {
    this.totalQuestions = 50;
    this.timeLimitSeconds = 15 * 60; // 15 Minutes
    this.maxHints = 5;

    this.questions = [];
    this.currentIndex = 0;
    this.userAnswers = {};
    this.flaggedQuestions = new Set();
    this.hintedQuestions = new Map();
    
    this.hintsRemaining = this.maxHints;
    this.secondsLeft = this.timeLimitSeconds;
    this.timerInterval = null;
    this.subject = 'ALL';
    this.level = 'Medium';
    this.isExamActive = false;
    this.startTime = null;
    this.endTime = null;
  }

  async startQuiz(subject = 'ALL', level = 'Medium') {
    this.subject = subject;
    this.level = level;
    this.currentIndex = 0;
    this.userAnswers = {};
    this.flaggedQuestions.clear();
    this.hintedQuestions.clear();
    this.hintsRemaining = this.maxHints;
    this.secondsLeft = this.timeLimitSeconds;
    this.isExamActive = true;
    this.startTime = Date.now();

    // Fetch 50 MCQs from Backend API
    try {
      if (window.apiClient) {
        const res = await window.apiClient.fetchQuestions(subject, level, this.totalQuestions);
        if (res && res.questions) {
          this.questions = res.questions;
        }
      }
    } catch (e) {
      console.warn("Falling back to local QuestionBank", e);
      if (window.QuestionBank) {
        this.questions = window.QuestionBank.generateQuestions(subject, level, this.totalQuestions);
      }
    }

    this.startTimer();
    this.renderCurrentQuestion();
    this.renderPalette();
    this.updateHeaderStats();

    if (window.soundEngine) window.soundEngine.playClick();
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    
    this.timerInterval = setInterval(() => {
      this.secondsLeft--;
      this.updateTimerDisplay();

      if (this.secondsLeft <= 120 && this.secondsLeft % 30 === 0) {
        if (window.soundEngine) window.soundEngine.playTick();
      }

      if (this.secondsLeft <= 0) {
        clearInterval(this.timerInterval);
        this.submitExam(true);
      }
    }, 1000);

    this.updateTimerDisplay();
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerDisplay() {
    const timerElem = document.getElementById('timer-display');
    const timerBox = document.getElementById('timer-box');
    if (!timerElem) return;

    const mins = Math.floor(this.secondsLeft / 60);
    const secs = this.secondsLeft % 60;
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    timerElem.textContent = formatted;

    if (this.secondsLeft <= 120) {
      timerBox?.classList.add('warning');
    } else {
      timerBox?.classList.remove('warning');
    }
  }

  renderCurrentQuestion() {
    const q = this.questions[this.currentIndex];
    if (!q) return;

    document.getElementById('q-subject-tag').textContent = q.subject;
    document.getElementById('q-level-tag').textContent = q.level;
    document.getElementById('q-current-num').textContent = this.currentIndex + 1;
    document.getElementById('q-total-count').textContent = this.totalQuestions;

    const qTextElem = document.getElementById('question-text');
    qTextElem.textContent = q.question;
    if (q.isUrdu) qTextElem.classList.add('urdu');
    else qTextElem.classList.remove('urdu');

    const optionsContainer = document.getElementById('options-list');
    optionsContainer.innerHTML = '';

    const eliminated = this.hintedQuestions.get(this.currentIndex) || [];
    const prefixes = ['A', 'B', 'C', 'D'];

    q.options.forEach((optText, optIdx) => {
      const optItem = document.createElement('div');
      optItem.className = 'option-item';
      if (this.userAnswers[this.currentIndex] === optIdx) {
        optItem.classList.add('selected');
      }
      if (eliminated.includes(optIdx)) {
        optItem.classList.add('eliminated');
      }

      optItem.onclick = () => {
        if (eliminated.includes(optIdx)) return;
        this.selectOption(optIdx);
      };

      const isUrduOpt = q.isUrdu ? ' urdu' : '';
      optItem.innerHTML = `
        <div class="option-prefix">${prefixes[optIdx]}</div>
        <div class="option-text${isUrduOpt}">${optText}</div>
      `;
      optionsContainer.appendChild(optItem);
    });

    const hintBtn = document.getElementById('btn-use-hint');
    const isAlreadyHinted = this.hintedQuestions.has(this.currentIndex);
    
    if (hintBtn) {
      hintBtn.disabled = this.hintsRemaining <= 0 || isAlreadyHinted;
      hintBtn.textContent = isAlreadyHinted ? 'Hint Used (50/50)' : 'Use Hint (50/50)';
    }

    const flagBtn = document.getElementById('btn-flag');
    if (flagBtn) {
      if (this.flaggedQuestions.has(this.currentIndex)) {
        flagBtn.classList.add('btn-gold');
        flagBtn.textContent = '★ Flagged';
      } else {
        flagBtn.classList.remove('btn-gold');
        flagBtn.textContent = '☆ Mark Review';
      }
    }

    this.updatePaletteHighlight();
  }

  selectOption(optIdx) {
    this.userAnswers[this.currentIndex] = optIdx;
    this.renderCurrentQuestion();
    this.renderPalette();
    if (window.soundEngine) window.soundEngine.playOptionSelect();
  }

  async useHint() {
    if (this.hintsRemaining <= 0 || this.hintedQuestions.has(this.currentIndex)) return;

    const q = this.questions[this.currentIndex];
    let toEliminate = [];

    // Call Backend 50/50 Hint API
    try {
      if (window.apiClient) {
        const res = await window.apiClient.getHint(q.options.length, q.answerIndex);
        if (res && res.eliminated) {
          toEliminate = res.eliminated;
        }
      }
    } catch (e) {
      const wrongIndices = [];
      q.options.forEach((_, idx) => {
        if (idx !== q.answerIndex) wrongIndices.push(idx);
      });
      toEliminate = wrongIndices.slice(0, 2);
    }

    this.hintedQuestions.set(this.currentIndex, toEliminate);
    this.hintsRemaining--;

    this.updateHeaderStats();
    this.renderCurrentQuestion();
    this.renderPalette();

    if (window.soundEngine) window.soundEngine.playHint();
  }

  toggleFlag() {
    if (this.flaggedQuestions.has(this.currentIndex)) {
      this.flaggedQuestions.delete(this.currentIndex);
    } else {
      this.flaggedQuestions.add(this.currentIndex);
    }
    this.renderCurrentQuestion();
    this.renderPalette();
  }

  nextQuestion() {
    if (this.currentIndex < this.totalQuestions - 1) {
      this.currentIndex++;
      this.renderCurrentQuestion();
      if (window.soundEngine) window.soundEngine.playClick();
    }
  }

  prevQuestion() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.renderCurrentQuestion();
      if (window.soundEngine) window.soundEngine.playClick();
    }
  }

  jumpToQuestion(idx) {
    if (idx >= 0 && idx < this.totalQuestions) {
      this.currentIndex = idx;
      this.renderCurrentQuestion();
      if (window.soundEngine) window.soundEngine.playClick();
    }
  }

  updateHeaderStats() {
    const hintsElem = document.getElementById('hints-remaining-count');
    if (hintsElem) hintsElem.textContent = this.hintsRemaining;
  }

  renderPalette() {
    const grid = document.getElementById('palette-grid');
    if (!grid) return;
    grid.innerHTML = '';

    for (let i = 0; i < this.totalQuestions; i++) {
      const btn = document.createElement('button');
      btn.className = 'palette-btn';
      btn.textContent = i + 1;

      if (i === this.currentIndex) btn.classList.add('current');
      if (this.userAnswers.hasOwnProperty(i)) btn.classList.add('answered');
      if (this.flaggedQuestions.has(i)) btn.classList.add('flagged');
      if (this.hintedQuestions.has(i)) btn.classList.add('hinted');

      btn.onclick = () => this.jumpToQuestion(i);
      grid.appendChild(btn);
    }
  }

  updatePaletteHighlight() {
    const buttons = document.querySelectorAll('.palette-btn');
    buttons.forEach((btn, idx) => {
      if (idx === this.currentIndex) btn.classList.add('current');
      else btn.classList.remove('current');
    });
  }

  async submitExam(isAuto = false) {
    if (!this.isExamActive) return;
    this.isExamActive = false;
    this.endTime = Date.now();
    this.stopTimer();

    const timeSpentSec = Math.round((this.endTime - this.startTime) / 1000);
    const user = window.authManager?.getUser() || { name: "Candidate", email: "candidate@quiz.org" };

    let examSummary = null;

    // Submit to Backend API
    try {
      if (window.apiClient) {
        const res = await window.apiClient.submitExam({
          user,
          subject: this.subject,
          level: this.level,
          questions: this.questions,
          userAnswers: this.userAnswers,
          timeSpentSec
        });
        if (res && res.result) {
          examSummary = res.result;
        }
      }
    } catch (e) {
      console.warn("Backend submit failed, executing local score calculation", e);
    }

    if (!examSummary) {
      let correctCount = 0;
      this.questions.forEach((q, idx) => {
        if (this.userAnswers[idx] === q.answerIndex) correctCount++;
      });
      const percentage = Math.round((correctCount / this.totalQuestions) * 100);
      examSummary = {
        score: correctCount,
        total: this.totalQuestions,
        percentage,
        passed: percentage >= 60,
        timeSpentSec,
        subject: this.subject,
        level: this.level,
        rank: 1,
        certificateId: `MQC-${Math.floor(100000 + Math.random() * 900000)}`
      };
    }

    if (window.soundEngine) {
      if (examSummary.passed) window.soundEngine.playVictory();
      else window.soundEngine.playClick();
    }

    if (window.app) window.app.showResults(examSummary);
  }
}

window.quizEngine = new QuizEngine();
