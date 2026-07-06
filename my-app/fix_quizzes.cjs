const fs = require('fs');
const path = 'src/app/(pages)/dashboard/student/_components/dailyTasks/page.js';
let content = fs.readFileSync(path, 'utf8');

const q1 = "{ title: 'Quiz on International Day Against Drug Abuse and Illicit Trafficking', url: 'https://quiz.mygov.in/quiz/quiz-on-international-day-against-drug-abuse-and-illicit-trafficking/' }";
const q2 = "{ title: 'Vande Mataram 150 Years Quiz', url: 'https://quiz.mygov.in/quiz/vande-mataram-150-years-quiz/' }";
const q3 = "{ title: 'Dr. B.R. Ambedkar\\'s Life and Contributions Quiz Competition 2026', url: 'https://quiz.mygov.in/quiz/dr-b-r-ambedkars-life-and-contributions-quiz-competition-2026/' }";
const q4 = "{ title: 'Ocean Science for a Viksit Bharat INCOIS Independence Day Quiz 2026', url: 'https://quiz.mygov.in/quiz/ocean-science-for-a-viksit-bharat-incois-independence-day-quiz-2026/' }";
const q5 = "{ title: 'Bharatiya Gyan Quiz on Architecture Engineering', url: 'https://quiz.mygov.in/quiz/bharatiya-gyan-quiz-on-architecture-engineering/' }";
const q6 = "{ title: 'National Quiz Competition on CA Day', url: 'https://quiz.mygov.in/quiz/national-quiz-competition-on-ca-day/' }";

// Replace SLOT2_MYGOV Day 3 quizzes
content = content.replace(
  /quizzes: \[\s*\{ title: 'Bharat GI Quiz – Celebrate India\\'s Heritage', url: 'https:\/\/quiz.mygov.in\/quiz\/bharat-gi-quiz-celebrate-indias-heritage\/' \},\s*\{ title: 'Commonwealth Games 2030 Quiz', url: 'https:\/\/quiz.mygov.in\/quiz\/commonwealth-games-2030-quiz\/' \},\s*\],/,
  `quizzes: [\n        ${q1},\n        ${q2},\n      ],`
);

// Replace SLOT2_MYGOV Day 4 quizzes
content = content.replace(
  /quizzes: \[\s*\{ title: 'MOHFW Fire Safety Quiz 2026', url: 'https:\/\/quiz.mygov.in\/quiz\/mohfw-fire-safety-quiz-2026\/' \},\s*\{ title: 'Quiz on Our Exam Warriors – Celebrating Exams', url: 'https:\/\/quiz.mygov.in\/quiz\/quiz-on-our-exam-warriors-celebrating-exams\/' \},\s*\],/,
  `quizzes: [\n        ${q3},\n        ${q4},\n      ],`
);

// Replace DAY5_MYGOV quizzes
content = content.replace(
  /const DAY5_MYGOV = \{\s*quizzes: \[\s*\{ title: 'Dr. B.R. Ambedkar\\'s Life and Contributions Quiz Competition 2026', url: 'https:\/\/quiz.mygov.in\/quiz\/dr-b-r-ambedkars-life-and-contributions-quiz-competition-2026\/' \},\s*\{ title: 'Vande Mataram 150 Years Quiz', url: 'https:\/\/quiz.mygov.in\/quiz\/vande-mataram-150-years-quiz\/' \},\s*\],/,
  `const DAY5_MYGOV = {\n    quizzes: [\n      ${q1},\n      ${q2},\n    ],`
);

// Replace SLOT4_DAY5_MYGOV quizzes
content = content.replace(
  /const SLOT4_DAY5_MYGOV = \{\s*quizzes: \[\s*\{ title: 'Bharat GI Quiz – Celebrate India’s Heritage', url: 'https:\/\/quiz.mygov.in\/quiz\/bharat-gi-quiz-celebrate-indias-heritage\/' \},\s*\{ title: 'Commonwealth Games 2030 Quiz', url: 'https:\/\/quiz.mygov.in\/quiz\/commonwealth-games-2030-quiz\/' \},\s*\{ title: 'Dr. B.R. Ambedkar’s Life and Contributions Quiz Competition 2026', url: 'https:\/\/quiz.mygov.in\/quiz\/dr-b-r-ambedkars-life-and-contributions-quiz-competition-2026\/' \},\s*\],/,
  `const SLOT4_DAY5_MYGOV = {\n    quizzes: [\n      ${q1},\n      ${q2},\n      ${q3},\n    ],`
);

// Replace QUIZZES_SLOT_1_3
content = content.replace(
  /const QUIZZES_SLOT_1_3 = \[\s*\{ title: `Bharat GI Quiz – Celebrate India’s Heritage`, url: 'https:\/\/quiz.mygov.in\/quiz\/bharat-gi-quiz-celebrate-indias-heritage\/' \},\s*\{ title: 'Commonwealth Games 2030 Quiz', url: 'https:\/\/quiz.mygov.in\/quiz\/commonwealth-games-2030-quiz\/' \},\s*\{ title: 'MOHFW Fire Safety Quiz 2026', url: 'https:\/\/quiz.mygov.in\/quiz\/mohfw-fire-safety-quiz-2026\/' \},\s*isSlot3\s*\?\s*\{ title: 'Bharatiya Gyan Quiz Series Mathematics Astronomy', url: 'https:\/\/quiz.mygov.in\/quiz\/bharatiya-gyan-quiz-series-mathematics-astronomy\/' \}\s*:\s*\{ title: 'Quiz on Our Exam Warriors – Celebrating Exams', url: 'https:\/\/quiz.mygov.in\/quiz\/quiz-on-our-exam-warriors-celebrating-exams\/' \},\s*\{ title: `Dr. B.R. Ambedkar’s Life and Contributions Quiz Competition 2026`, url: 'https:\/\/quiz.mygov.in\/quiz\/dr-b-r-ambedkars-life-and-contributions-quiz-competition-2026\/' \},\s*\{ title: 'Vande Mataram 150 Years Quiz', url: 'https:\/\/quiz.mygov.in\/quiz\/vande-mataram-150-years-quiz\/' \},\s*\];/,
  `const QUIZZES_SLOT_1_3 = [\n    ${q1},\n    ${q2},\n    ${q3},\n    ${q4},\n    ${q5},\n    ${q6},\n  ];`
);

// Replace SLOT4_QUIZZES
content = content.replace(
  /const SLOT4_QUIZZES = \[\s*\{ title: 'Vande Mataram 150 Years Quiz', url: 'https:\/\/quiz.mygov.in\/quiz\/vande-mataram-150-years-quiz\/' \},\s*\{ title: 'PM Internship Quiz', url: 'https:\/\/quiz.mygov.in\/quiz\/pm-internship-quiz\/' \},\s*\{ title: 'Quiz on Observance of 350 Years of Martyrdom of Sri Guru Tegh Bahadur Ji', url: 'https:\/\/quiz.mygov.in\/quiz\/quiz-on-observance-of-350-years-of-martyrdom-of-sri-guru-tegh-bahadur-ji\/' \},\s*\];/,
  `const SLOT4_QUIZZES = [\n    ${q4},\n    ${q5},\n    ${q6},\n  ];`
);

// Replace SLOT5_QUIZZES
content = content.replace(
  /const SLOT5_QUIZZES = \[\s*\{ title: 'Vande Mataram 150 Years Quiz', url: 'https:\/\/quiz.mygov.in\/quiz\/vande-mataram-150-years-quiz\/' \},\s*\{ title: 'Quiz on Awareness of Senior Citizens Rights and Welfare Schemes', url: 'https:\/\/quiz.mygov.in\/quiz\/quiz-on-awareness-of-senior-citizens-rights-and-welfare-schemes\/' \},\s*\{ title: 'Quiz on Observance of 350 Years of Martyrdom of Sri Guru Tegh Bahadur Ji', url: 'https:\/\/quiz.mygov.in\/quiz\/quiz-on-observance-of-350-years-of-martyrdom-of-sri-guru-tegh-bahadur-ji\/' \},\s*\];/,
  `const SLOT5_QUIZZES = [\n    ${q4},\n    ${q5},\n    ${q6},\n  ];`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Quizzes updated successfully');
