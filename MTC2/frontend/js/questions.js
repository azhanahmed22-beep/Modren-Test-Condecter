/* ==========================================================================
   MODREN QUIZ COUNDECTER - Frontend Question Bank Fallback
   ========================================================================== */

const QuestionBank = {
  baseQuestions: [
    { subject: "GK", level: "Easy", question: "What is the capital city of France?", options: ["Berlin", "Madrid", "Paris", "Rome"], answerIndex: 2 },
    { subject: "GK", level: "Easy", question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], answerIndex: 1 },
    { subject: "GK", level: "Medium", question: "Which is the largest desert in the world?", options: ["Sahara Desert", "Gobi Desert", "Antarctic Desert", "Arabian Desert"], answerIndex: 2 },
    { subject: "GK", level: "Hard", question: "Which treaty ended World War I in 1919?", options: ["Treaty of Paris", "Treaty of Versailles", "Treaty of Utrecht", "Treaty of Vienna"], answerIndex: 1 },
    { subject: "ENGLISH", level: "Easy", question: "Choose the correct antonym of 'Hot':", options: ["Warm", "Cold", "Boiling", "Spicy"], answerIndex: 1 },
    { subject: "URDU", level: "Easy", question: "اردو زبان کا قومی شاعر کون ہے؟", options: ["مرزا غالب", "علامہ اقبال", "فیض احمد فیض", "احمد فراز"], answerIndex: 1, isUrdu: true },
    { subject: "SCIENCE", level: "Easy", question: "What is the chemical symbol for Water?", options: ["CO2", "H2O", "O2", "NaCl"], answerIndex: 1 },
    { subject: "SST", level: "Easy", question: "Which line divides the Earth into Northern and Southern Hemispheres?", options: ["Prime Meridian", "Equator", "Tropic of Cancer", "Tropic of Capricorn"], answerIndex: 1 },
    { subject: "MATH", level: "Easy", question: "What is 15 multiplied by 8?", options: ["100", "110", "120", "130"], answerIndex: 2 },
    { subject: "PST", level: "Easy", question: "Who was the founder of Pakistan?", options: ["Allama Iqbal", "Quaid-e-Azam Muhammad Ali Jinnah", "Liaquat Ali Khan", "Sir Syed Ahmad Khan"], answerIndex: 1 },
    { subject: "IQ", level: "Easy", question: "Which number comes next in the series: 2, 4, 6, 8, __?", options: ["9", "10", "11", "12"], answerIndex: 1 }
  ],

  generateQuestions(subjectFilter = "ALL", levelFilter = "Medium", count = 50) {
    let pool = [];
    this.baseQuestions.forEach(q => {
      if ((subjectFilter === "ALL" || q.subject === subjectFilter) && (levelFilter === "ALL" || q.level === levelFilter)) {
        pool.push({ ...q });
      }
    });

    const subjects = ["GK", "ENGLISH", "URDU", "SCIENCE", "SST", "MATH", "PST", "IQ"];
    let idCounter = pool.length + 1;

    while (pool.length < count * 2) {
      const sub = (subjectFilter === "ALL") ? subjects[pool.length % subjects.length] : subjectFilter;
      pool.push(this.generateProceduralQuestion(sub, levelFilter, idCounter++));
    }

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool.slice(0, count).map((q, idx) => ({
      id: `q_${idx + 1}`,
      num: idx + 1,
      subject: q.subject,
      level: q.level,
      question: q.question,
      options: [...q.options],
      answerIndex: q.answerIndex,
      isUrdu: !!q.isUrdu
    }));
  },

  generateProceduralQuestion(sub, lvl, seed) {
    return {
      subject: sub, level: lvl,
      question: `Sample Question #${seed} for ${sub} (${lvl} Level)`,
      options: ["Option A (Correct)", "Option B", "Option C", "Option D"],
      answerIndex: 0
    };
  }
};

window.QuestionBank = QuestionBank;
