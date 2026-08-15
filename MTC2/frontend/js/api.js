/* ==========================================================================
   MODREN QUIZ COUNDECTER - Frontend REST API Client
   Communicates directly with the Express / Python Backend (http://localhost:5001/api)
   ========================================================================== */

class QuizApiClient {
  constructor(baseUrl = 'http://localhost:5001/api') {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.warn(`Backend API call failed (${endpoint}), falling back to local processing if available.`, err);
      throw err;
    }
  }

  // 1. Auth Login
  async login(email, name) {
    return await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, name })
    });
  }

  // 2. Fetch 50 MCQs
  async fetchQuestions(subject = 'ALL', level = 'Hard', count = 50) {
    return await this.request(`/quiz/questions?subject=${encodeURIComponent(subject)}&level=${encodeURIComponent(level)}&count=${count}`);
  }

  // 3. Request 50/50 Hint Elimination
  async getHint(optionsCount, correctIndex) {
    return await this.request('/quiz/hint', {
      method: 'POST',
      body: JSON.stringify({ optionsCount, correctIndex })
    });
  }

  // 4. Submit Exam
  async submitExam(submissionData) {
    return await this.request('/quiz/submit', {
      method: 'POST',
      body: JSON.stringify(submissionData)
    });
  }

  // 5. Fetch Level Leaderboard
  async getLeaderboard(level) {
    return await this.request(`/leaderboard/${encodeURIComponent(level)}`);
  }

  // 6. Fetch Certificate Details
  async getCertificate(certId) {
    return await this.request(`/certificate/${encodeURIComponent(certId)}`);
  }
}

window.apiClient = new QuizApiClient();
