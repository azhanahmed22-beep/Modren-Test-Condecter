/* ==========================================================================
   MODREN QUIZ COUNDECTER - Frontend Leaderboard Controller
   Fetches level-specific leaderboards from Express Backend
   ========================================================================== */

class LeaderboardManager {
  constructor() {
    this.levels = ['Impossible', 'Expert', 'Hard', 'Medium', 'Easy'];
  }

  async getLeaderboard(level) {
    try {
      if (window.apiClient) {
        const res = await window.apiClient.getLeaderboard(level);
        if (res && res.data) {
          return res.data;
        }
      }
    } catch (e) {
      console.warn("Backend leaderboard fetch failed, falling back to LocalStorage", e);
    }

    const key = `mqc_leaderboard_${level.toLowerCase()}`;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      return [];
    }
  }
}

window.leaderboardManager = new LeaderboardManager();
