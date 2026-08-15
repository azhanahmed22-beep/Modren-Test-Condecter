/* ==========================================================================
   MODREN QUIZ COUNDECTER - Frontend Main Controller
   ========================================================================== */

class AppController {
  constructor() {
    this.selectedSubject = 'ALL';
    this.selectedLevel = 'Hard';
    this.currentExamSummary = null;
  }

  init() {
    this.setupEventListeners();
    this.checkAuthStatus();
  }

  setupEventListeners() {
    // Auth Login Form
    const authForm = document.getElementById('auth-form');
    if (authForm) {
      authForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const name = document.getElementById('login-name').value;
        try {
          if (window.apiClient) {
            await window.apiClient.login(email, name);
          }
          window.authManager.login(email, name);
          this.checkAuthStatus();
          if (window.soundEngine) window.soundEngine.playClick();
        } catch (err) {
          alert(err.message);
        }
      };
    }

    // Logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.onclick = () => {
        window.authManager.logout();
        this.checkAuthStatus();
      };
    }

    // Navigation Links
    document.getElementById('nav-dashboard')?.addEventListener('click', () => this.showView('dashboard'));
    document.getElementById('nav-leaderboard')?.addEventListener('click', () => {
      this.renderLeaderboard(this.selectedLevel);
      this.showView('leaderboard');
    });

    // Subject Buttons
    document.querySelectorAll('.subject-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.subject-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedSubject = btn.dataset.subject;
        if (window.soundEngine) window.soundEngine.playClick();
      };
    });

    // Level Buttons
    document.querySelectorAll('.level-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedLevel = btn.dataset.level;
        if (window.soundEngine) window.soundEngine.playClick();
      };
    });

    // Start Quiz Button
    document.getElementById('btn-start-quiz')?.addEventListener('click', () => {
      this.showView('quiz');
      window.quizEngine.startQuiz(this.selectedSubject, this.selectedLevel);
    });

    // Quiz Controls
    document.getElementById('btn-prev-q')?.addEventListener('click', () => window.quizEngine.prevQuestion());
    document.getElementById('btn-next-q')?.addEventListener('click', () => window.quizEngine.nextQuestion());
    document.getElementById('btn-flag')?.addEventListener('click', () => window.quizEngine.toggleFlag());
    document.getElementById('btn-use-hint')?.addEventListener('click', () => window.quizEngine.useHint());
    document.getElementById('btn-submit-exam')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to submit your 50 MCQ test?')) {
        window.quizEngine.submitExam();
      }
    });

    // Results Screen Buttons
    document.getElementById('btn-view-certificate')?.addEventListener('click', () => this.openCertificateModal());
    document.getElementById('btn-results-leaderboard')?.addEventListener('click', () => {
      this.renderLeaderboard(this.selectedLevel);
      this.showView('leaderboard');
    });
    document.getElementById('btn-retake-quiz')?.addEventListener('click', () => {
      this.showView('dashboard');
    });

    // Leaderboard Tabs
    document.querySelectorAll('.lb-tab').forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const lvl = tab.dataset.level;
        this.renderLeaderboard(lvl);
        if (window.soundEngine) window.soundEngine.playClick();
      };
    });

    // Certificate Modal Controls
    document.getElementById('btn-close-cert')?.addEventListener('click', () => this.closeCertificateModal());
    document.getElementById('btn-download-cert')?.addEventListener('click', () => {
      const name = window.authManager.getUser()?.name || 'Candidate';
      window.certificateGenerator.downloadPNG(`MQC_Certificate_${name.replace(/\s+/g, '_')}.png`);
    });
  }

  checkAuthStatus() {
    if (window.authManager.isLoggedIn()) {
      const user = window.authManager.getUser();
      document.getElementById('user-profile-badge').classList.remove('hidden');
      document.getElementById('header-avatar').textContent = user.initial;
      document.getElementById('header-user-email').textContent = user.name;
      this.showView('dashboard');
    } else {
      document.getElementById('user-profile-badge').classList.add('hidden');
      this.showView('auth');
    }
  }

  showView(viewName) {
    document.querySelectorAll('.view-section').forEach(view => {
      view.classList.remove('active');
    });
    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showResults(summary) {
    this.currentExamSummary = summary;
    this.showView('results');

    document.getElementById('res-score-num').textContent = summary.score;
    document.getElementById('res-percentage').textContent = `${summary.percentage}% ACCURACY`;
    document.getElementById('res-time').textContent = `${Math.floor(summary.timeSpentSec / 60)}m ${summary.timeSpentSec % 60}s`;
    document.getElementById('res-rank').textContent = `#${summary.rank}`;
    document.getElementById('res-status').textContent = summary.passed ? 'PASSED' : 'FAILED';
    document.getElementById('res-status').style.color = summary.passed ? 'var(--accent-emerald)' : 'var(--accent-rose)';

    const announceBox = document.getElementById('cert-announce-box');
    if (summary.passed) {
      announceBox.classList.remove('hidden');
      document.getElementById('cert-announce-desc').textContent = 
        summary.certificateMessage || `You just passed ${summary.level} level with top ${summary.rank} position! Your official certificate is generated and ready.`;
    } else {
      announceBox.classList.add('hidden');
    }
  }

  async renderLeaderboard(level) {
    const tableBody = document.getElementById('lb-table-body');
    const levelTitle = document.getElementById('lb-current-level-title');
    if (!tableBody) return;

    if (levelTitle) levelTitle.textContent = level.toUpperCase();

    const data = await window.leaderboardManager.getLeaderboard(level);
    tableBody.innerHTML = '';

    if (!data || data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem;">No candidates yet for ${level} level. Be the first!</td></tr>`;
      return;
    }

    data.forEach((entry, idx) => {
      const rank = idx + 1;
      let rankClass = '';
      if (rank === 1) rankClass = 'lb-rank-1';
      else if (rank === 2) rankClass = 'lb-rank-2';
      else if (rank === 3) rankClass = 'lb-rank-3';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="lb-rank ${rankClass}">#${rank}</td>
        <td>
          <div class="lb-user-cell">
            <div class="user-avatar" style="width:28px; height:28px; font-size:0.75rem;">${entry.name.charAt(0).toUpperCase()}</div>
            <div>
              <div>${entry.name}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${entry.email}</div>
            </div>
          </div>
        </td>
        <td><strong>${entry.score} / 50</strong> (${entry.percentage}%)</td>
        <td>${Math.floor(entry.timeSpentSec / 60)}m ${entry.timeSpentSec % 60}s</td>
        <td>${entry.date}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  openCertificateModal() {
    const modal = document.getElementById('cert-modal');
    if (!modal) return;

    const user = window.authManager.getUser() || { name: 'Candidate' };
    const summary = this.currentExamSummary || {
      score: 50,
      level: this.selectedLevel,
      subject: this.selectedSubject,
      rank: 1,
      certificateId: 'MQC-889922'
    };

    window.certificateGenerator.generateCertificate({
      name: user.name,
      level: summary.level,
      subject: summary.subject,
      score: summary.score,
      rank: summary.rank,
      certificateId: summary.certificateId,
      date: new Date().toLocaleDateString()
    });

    modal.classList.add('active');
    if (window.soundEngine) window.soundEngine.playVictory();
  }

  closeCertificateModal() {
    const modal = document.getElementById('cert-modal');
    if (modal) modal.classList.remove('active');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
  window.app.init();
});
