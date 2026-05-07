/**
 * Case Study Templates — Domain Specific
 * Each entry: { title: string, sections: [ { heading: string, fields: string[] } ] }
 * Add new domains by inserting more keys below.
 */

export const CASE_STUDY_TEMPLATES = {

  /* ── 1. VILLAGE INFRASTRUCTURE ─────────────────────────── */
  'Village Infrastructure': {
    title: 'VILLAGE INFRASTRUCTURE – CASE STUDY REPORT',
    sections: [
      {
        heading: '1. Basic Information',
        fields: ['Student Name', 'Roll Number', 'Village/Area', 'District', 'Domain', 'Problem Statement', 'Duration'],
      },
      {
        heading: '2. Problem Description',
        fields: ['What is the infrastructure issue?', 'Where is it observed (specific locations)?'],
      },
      {
        heading: '3. Stakeholders Covered',
        fields: ['Households', 'Workers/Officials', 'Others'],
      },
      {
        heading: '4. Survey Summary',
        fields: ['Total respondents', 'Stakeholder-wise distribution'],
      },
      {
        heading: '5. Data Analysis',
        tableHeaders: ['Stakeholder', 'No. of Questions', 'Yes (%)', 'No (%)', 'Key Issue'],
        tableRows: ['Households', 'Workers', 'Panchayat'],
      },
      {
        heading: '6. Key Findings',
        fields: ['Major problems identified', 'Impact of the Problems', 'Root causes'],
      },
      {
        heading: '7. Field Observations',
        fields: ['Physical observations', 'Infrastructure condition', 'Photographic evidence'],
      },
      {
        heading: '8. Impact Analysis',
        fields: ['Impact on daily life', 'Economic impact', 'Health/safety impact'],
      },
      {
        heading: '9. Intervention by Student',
        fields: ['Activity conducted', 'People involved', 'Immediate outcome'],
      },
      {
        heading: '10. Suggestions & Recommendations',
        fields: ['Short-term solutions', 'Long-term improvements'],
      },
      {
        heading: '11. Conclusion',
        fields: ['Summary of findings', 'Future scope'],
      },
    ],
  },

  /* ── 2. HEALTH & HYGIENE ────────────────────────────────── */
  'Health and Hygiene': {
    title: 'HEALTH & HYGIENE – CASE STUDY REPORT',
    sections: [
      {
        heading: '1. Basic Details',
        fields: ['Student Name', 'Roll Number', 'Village/Area', 'District', 'State', 'Domain', 'Problem Statement', 'Duration'],
      },
      {
        heading: '2. Problem Description',
        fields: ['What is the selected health/hygiene issue?', 'Where is it observed?'],
      },
      {
        heading: '3. Stakeholders Covered',
        fields: ['Households', 'Health Workers', 'Others'],
      },
      {
        heading: '4. Survey Summary',
        fields: ['Total respondents', 'Stakeholder-wise distribution'],
      },
      {
        heading: '5. Data Analysis',
        tableHeaders: ['Stakeholder', 'No. of Questions', 'Yes (%)', 'No (%)', 'Key Issue'],
        tableRows: ['Households', 'Health Workers', 'Others'],
      },
      {
        heading: '6. Key Findings',
        fields: ['Major problems identified', 'Impact of the Problems', 'Root causes'],
      },
      {
        heading: '7. Field Observations',
        fields: ['Hygiene conditions', 'Environmental conditions', 'Behavioral observations'],
      },
      {
        heading: '8. Impact Analysis',
        fields: ['Health impact', 'Social impact', 'Economic impact'],
      },
      {
        heading: '9. Student Intervention',
        fields: ['Activity conducted', 'Target group', 'Outcome observed'],
      },
      {
        heading: '10. Recommendations',
        fields: ['Short-term solutions', 'Long-term solutions'],
      },
      {
        heading: '11. Conclusion',
        fields: ['Summary of findings', 'Future scope'],
      },
    ],
  },

  /* ── 3. AGRICULTURE ────────────────────────────────────── */
  'Agriculture': {
    title: 'AGRICULTURE – CASE STUDY REPORT',
    sections: [
      {
        heading: '1. Basic Details',
        fields: ['Student Name', 'Roll Number', 'Village/Area Name', 'District', 'State', 'Domain', 'Problem Statement', 'Duration'],
      },
      {
        heading: '2. Problem Description',
        fields: ['What is the selected agricultural issue?', 'Where is it observed (specific farms/areas)?', 'Why is this problem important?'],
      },
      {
        heading: '3. Stakeholders Covered',
        fields: ['Farmers', 'Agriculture Officers / Experts', 'Other Stakeholders (Traders/Banks/etc.)'],
      },
      {
        heading: '4. Survey Summary',
        fields: ['Total respondents', 'Stakeholder-wise count'],
      },
      {
        heading: '5. Data Analysis',
        tableHeaders: ['Stakeholder', 'No. of Questions', 'Yes (%)', 'No (%)', 'Key Issue'],
        tableRows: ['Farmers', 'Officials', 'Others'],
      },
      {
        heading: '6. Key Findings',
        fields: ['Major problems identified', 'Severity Level (Low / Moderate / High)', 'Root Causes'],
      },
      {
        heading: '7. Field Observations',
        fields: ['Condition of farms', 'Irrigation methods', 'Crop condition', 'Technology usage'],
      },
      {
        heading: '8. Impact Analysis',
        fields: ['Economic impact on farmers', 'Crop yield impact', 'Environmental impact'],
      },
      {
        heading: '9. Student Intervention',
        fields: ['Activity conducted', 'Target group', 'Number of people involved', 'Immediate outcome'],
      },
      {
        heading: '10. Recommendations',
        fields: ['Short-term solutions', 'Long-term improvements', 'Government/technology suggestions'],
      },
      {
        heading: '11. Conclusion',
        fields: ['Summary of findings', 'Future scope'],
      },
    ],
  },

  /* ── 4. WATER CONSERVATION ──────────────────────────────── */
  'Water Conservation': {
    title: 'WATER CONSERVATION – CASE STUDY REPORT',
    sections: [
      {
        heading: '1. Basic Details',
        fields: ['Student Name', 'Roll Number', 'Village/Area', 'District', 'State', 'Domain', 'Problem Statement', 'Duration'],
      },
      {
        heading: '2. Problem Description',
        fields: ['What is the selected water issue?', 'Where is it observed (specific locations)?', 'Why is this problem important?'],
      },
      {
        heading: '3. Stakeholders Covered',
        fields: ['Households', 'Farmers', 'Panchayat / Officials / Workers'],
      },
      {
        heading: '4. Survey Summary',
        fields: ['Total respondents', 'Stakeholder-wise distribution'],
      },
      {
        heading: '5. Data Analysis',
        tableHeaders: ['Stakeholder', 'No. of Questions', 'Yes (%)', 'No (%)', 'Key Issue'],
        tableRows: ['Households', 'Farmers', 'Officials'],
      },
      {
        heading: '6. Key Findings',
        fields: ['Major problems identified', 'Severity Level (Low / Moderate / High)', 'Root Causes'],
      },
      {
        heading: '7. Field Observations',
        fields: ['Water availability condition', 'Storage practices', 'Leakage/wastage points', 'Infrastructure condition'],
      },
      {
        heading: '8. Impact Analysis',
        fields: ['Impact on daily life', 'Agricultural impact', 'Environmental impact'],
      },
      {
        heading: '9. Student Intervention',
        fields: ['Activity conducted', 'Target group', 'Number of people involved', 'Immediate outcome'],
      },
      {
        heading: '10. Recommendations',
        fields: ['Short-term solutions', 'Long-term solutions', 'Community/government suggestions'],
      },
      {
        heading: '11. Conclusion',
        fields: ['Summary of findings', 'Future scope'],
      },
    ],
  },

  /* ── 5. SOLID WASTE MANAGEMENT ──────────────────────────── */
  'Waste Management': {
    title: 'SOLID WASTE MANAGEMENT – CASE STUDY REPORT',
    sections: [
      {
        heading: '1. Basic Details',
        fields: ['Student Name', 'Roll Number', 'Village/Area', 'District', 'State', 'Domain', 'Problem Statement', 'Duration'],
      },
      {
        heading: '2. Problem Description',
        fields: ['What is the selected waste issue?', 'Where is it observed (specific locations)?', 'Why is this problem important?'],
      },
      {
        heading: '3. Stakeholders Covered',
        fields: ['Households', 'Sanitation Workers', 'Panchayat / Officials'],
      },
      {
        heading: '4. Survey Summary',
        fields: ['Total respondents', 'Stakeholder-wise distribution'],
      },
      {
        heading: '5. Data Analysis',
        tableHeaders: ['Stakeholder', 'No. of Questions', 'Yes (%)', 'No (%)', 'Key Issue'],
        tableRows: ['Households', 'Workers', 'Officials'],
      },
      {
        heading: '6. Key Findings',
        fields: ['Major problems identified', 'Impact of the Problems', 'Root causes'],
      },
      {
        heading: '7. Field Observations',
        fields: ['Waste disposal practices', 'Cleanliness condition', 'Dumping locations', 'Infrastructure status'],
      },
      {
        heading: '8. Impact Analysis',
        fields: ['Health impact', 'Environmental impact', 'Social impact'],
      },
      {
        heading: '9. Student Intervention',
        fields: ['Activity conducted', 'Target group', 'Number of people involved', 'Immediate outcome'],
      },
      {
        heading: '10. Recommendations',
        fields: ['Short-term solutions', 'Long-term solutions', 'Policy/community suggestions'],
      },
      {
        heading: '11. Conclusion',
        fields: ['Summary of findings', 'Future scope'],
      },
    ],
  },

  /* ── 6. DIGITAL LITERACY & ICT ──────────────────────────── */
  'Digital Literacy': {
    title: 'DIGITAL LITERACY & ICT – CASE STUDY REPORT',
    sections: [
      {
        heading: '1. Basic Details',
        fields: ['Student Name', 'Roll Number', 'Village/Area', 'District', 'State', 'Domain', 'Problem Statement', 'Duration'],
      },
      {
        heading: '2. Problem Description',
        fields: ['What is the selected ICT/digital issue?', 'Where is it observed (specific households/areas)?', 'Why is this problem important?'],
      },
      {
        heading: '3. Stakeholders Covered',
        fields: ['Households', 'Students / Job Seekers', 'CSC Operators / Officials / Trainers'],
      },
      {
        heading: '4. Survey Summary',
        fields: ['Total respondents', 'Stakeholder-wise distribution'],
      },
      {
        heading: '5. Data Analysis',
        tableHeaders: ['Stakeholder', 'No. of Questions', 'Yes (%)', 'No (%)', 'Key Issue'],
        tableRows: ['Households', 'Students', 'Others'],
      },
      {
        heading: '6. Key Findings',
        fields: ['Major problems identified', 'Impact of the Problems', 'Root causes'],
      },
      {
        heading: '7. Field Observations',
        fields: ['Device usage patterns', 'Internet availability', 'Skill gaps', 'Dependency on others'],
      },
      {
        heading: '8. Impact Analysis',
        fields: ['Impact on education', 'Impact on employment', 'Impact on daily life'],
      },
      {
        heading: '9. Student Intervention',
        fields: ['Activity conducted', 'Target group', 'Number of participants', 'Immediate outcomes'],
      },
      {
        heading: '10. Recommendations',
        fields: ['Short-term solutions', 'Long-term solutions', 'Government/community suggestions'],
      },
      {
        heading: '11. Conclusion',
        fields: ['Summary of findings', 'Future scope'],
      },
    ],
  },

  /* ── 7. WOMEN EMPOWERMENT & GENDER EQUALITY ─────────────── */
  'Women Empowerment': {
    title: 'WOMEN EMPOWERMENT & GENDER EQUALITY – CASE STUDY REPORT',
    sections: [
      {
        heading: '1. Basic Details',
        fields: ['Student Name', 'Roll Number', 'Village/Area', 'District', 'State', 'Domain', 'Problem Statement', 'Duration'],
      },
      {
        heading: '2. Problem Description',
        fields: ['What is the selected issue?', 'Where is it observed (specific households/community)?', 'Why is this problem important?'],
      },
      {
        heading: '3. Stakeholders Covered',
        fields: ['Women', 'Family Members', 'Officials / SHGs / Teachers'],
      },
      {
        heading: '4. Survey Summary',
        fields: ['Total respondents', 'Stakeholder-wise distribution'],
      },
      {
        heading: '5. Data Analysis',
        tableHeaders: ['Stakeholder', 'No. of Questions', 'Yes (%)', 'No (%)', 'Key Issue'],
        tableRows: ['Women', 'Family', 'Others'],
      },
      {
        heading: '6. Key Findings',
        fields: ['Major problems identified', 'Impact of the Problems', 'Root causes'],
      },
      {
        heading: '7. Field Observations',
        fields: ['Women participation level', 'Social restrictions', 'Economic conditions', 'Awareness level'],
      },
      {
        heading: '8. Impact Analysis',
        fields: ["Impact on women's independence", 'Impact on education/employment', 'Social impact'],
      },
      {
        heading: '9. Student Intervention',
        fields: ['Activity conducted', 'Target group', 'Number of participants', 'Immediate outcomes'],
      },
      {
        heading: '10. Recommendations',
        fields: ['Short-term solutions', 'Long-term solutions', 'Community/government suggestions'],
      },
      {
        heading: '11. Conclusion',
        fields: ['Summary of findings', 'Future scope'],
      },
    ],
  },

  /* ── 8. NUTRITION & FOOD SECURITY ───────────────────────── */
  'Nutrition': {
    title: 'NUTRITION & FOOD SECURITY – CASE STUDY REPORT',
    sections: [
      {
        heading: '1. Basic Details',
        fields: ['Student Name', 'Roll Number', 'Village/Area', 'District', 'State', 'Domain', 'Problem Statement', 'Duration'],
      },
      {
        heading: '2. Problem Description',
        fields: ['What is the selected issue?', 'Where is it observed (specific households/locations)?', 'Why is this problem important?'],
      },
      {
        heading: '3. Stakeholders Covered',
        fields: ['Households', 'Mothers/Women', 'Anganwadi Workers', 'Health Workers', 'Vendors/Teachers (if applicable)'],
      },
      {
        heading: '4. Survey Summary',
        fields: ['Total respondents', 'Stakeholder-wise distribution'],
      },
      {
        heading: '5. Data Analysis',
        tableHeaders: ['Stakeholder', 'No. of Questions', 'Yes (%)', 'No (%)', 'Key Issue'],
        tableRows: ['Households', 'Women', 'Others'],
      },
      {
        heading: '6. Key Findings',
        fields: ['Major problems identified', 'Severity Level (Low / Moderate / High)', 'Root Causes'],
      },
      {
        heading: '7. Field Observations',
        fields: ['Food availability', 'Diet patterns', 'Awareness level', 'Economic conditions'],
      },
      {
        heading: '8. Impact Analysis',
        fields: ['Health impact (children, women)', 'Economic impact', 'Social impact'],
      },
      {
        heading: '9. Student Intervention',
        fields: ['Activity conducted', 'Target group', 'Number of participants', 'Immediate outcomes'],
      },
      {
        heading: '10. Recommendations',
        fields: ['Short-term solutions', 'Long-term solutions', 'Community/government suggestions'],
      },
      {
        heading: '11. Conclusion',
        fields: ['Summary of findings', 'Future scope'],
      },
    ],
  },

  /* ── 9. WATER & SANITATION ──────────────────────────────── */
  'Water and Sanitation': {
    title: 'WATER & SANITATION – CASE STUDY REPORT',
    sections: [
      {
        heading: '1. Basic Details',
        fields: ['Student Name', 'Roll Number', 'Village/Area', 'District', 'State', 'Domain', 'Problem Statement', 'Duration'],
      },
      {
        heading: '2. Problem Description',
        fields: ['What is the selected issue?', 'Where is it observed?', 'Why is this problem important?'],
      },
      {
        heading: '3. Stakeholders Covered',
        fields: ['Households', 'Sanitation Workers', 'Panchayat Officials', 'Health Workers'],
      },
      {
        heading: '4. Survey Summary',
        fields: ['Total respondents', 'Stakeholder-wise distribution'],
      },
      {
        heading: '5. Data Analysis',
        tableHeaders: ['Stakeholder', 'No. of Questions', 'Yes (%)', 'No (%)', 'Key Issue'],
        tableRows: ['Households', 'Workers', 'Officials'],
      },
      {
        heading: '6. Key Findings',
        fields: ['Major problems identified', 'Severity Level (Low / Moderate / High)', 'Root Causes'],
      },
      {
        heading: '7. Field Observations',
        fields: ['Water sources condition', 'Sanitation facilities', 'Hygiene practices', 'Infrastructure gaps'],
      },
      {
        heading: '8. Impact Analysis',
        fields: ['Health impact', 'Environmental impact', 'Social impact'],
      },
      {
        heading: '9. Student Intervention',
        fields: ['Activity conducted', 'Target group', 'Number of participants', 'Immediate outcomes'],
      },
      {
        heading: '10. Recommendations',
        fields: ['Short-term solutions', 'Long-term solutions', 'Community/government suggestions'],
      },
      {
        heading: '11. Conclusion',
        fields: ['Summary', 'Future scope'],
      },
    ],
  },

  /* ── 10. COMMUNITY ACTIONS ───────────────────────────────── */
  'Community': {
    title: 'COMMUNITY ACTIONS – CASE STUDY REPORT',
    sections: [
      {
        heading: '1. Basic Details',
        fields: ['Student Name', 'Roll Number', 'Village/Area', 'District', 'State', 'Domain', 'Problem Statement', 'Duration'],
      },
      {
        heading: '2. Problem Description',
        fields: ['What is the selected community issue?', 'Where is it observed?', 'Why is it important?'],
      },
      {
        heading: '3. Stakeholders Covered',
        fields: ['Residents', 'Youth/Students', 'Leaders', 'Officials/NGOs'],
      },
      {
        heading: '4. Survey Summary',
        fields: ['Total respondents', 'Stakeholder distribution'],
      },
      {
        heading: '5. Data Analysis',
        tableHeaders: ['Stakeholder', 'No. of Questions', 'Yes (%)', 'No (%)', 'Key Issue'],
        tableRows: ['Residents', 'Youth', 'Others'],
      },
      {
        heading: '6. Key Findings',
        fields: ['Major issues identified', 'Impact of the Problems', 'Root causes'],
      },
      {
        heading: '7. Field Observations',
        fields: ['Participation level', 'Awareness level', 'Community behavior'],
      },
      {
        heading: '8. Impact Analysis',
        fields: ['Social impact', 'Participation impact', 'Behavioral impact'],
      },
      {
        heading: '9. Student Intervention',
        fields: ['Activity conducted', 'Target group', 'Number of participants', 'Immediate outcomes'],
      },
      {
        heading: '10. Recommendations',
        fields: ['Short-term solutions', 'Long-term solutions', 'Community/government suggestions'],
      },
      {
        heading: '11. Conclusion',
        fields: ['Summary', 'Future scope'],
      },
    ],
  },

  /* ── 11. RURAL / URBAN EDUCATION ────────────────────────── */
  'Education': {
    title: 'RURAL / URBAN EDUCATION – CASE STUDY REPORT',
    sections: [
      {
        heading: '1. Basic Details',
        fields: ['Student Name', 'Roll Number', 'Village/Area', 'School Name', 'District', 'State', 'Domain', 'Problem Statement', 'Duration'],
      },
      {
        heading: '2. Problem Description',
        fields: ['What is the selected issue?', 'Where is it observed (students/school)?', 'Why is it important?'],
      },
      {
        heading: '3. Stakeholders Covered',
        fields: ['Students', 'Parents', 'Teachers', 'School Management'],
      },
      {
        heading: '4. Survey Summary',
        fields: ['Total respondents', 'Stakeholder-wise distribution'],
      },
      {
        heading: '5. Data Analysis',
        tableHeaders: ['Stakeholder', 'No. of Questions', 'Yes (%)', 'No (%)', 'Key Issue'],
        tableRows: ['Students', 'Parents', 'Teachers'],
      },
      {
        heading: '6. Key Findings',
        fields: ['Major problems identified', 'Impact of the Problems', 'Root causes'],
      },
      {
        heading: '7. Field Observations',
        fields: ['Attendance patterns', 'Learning levels', 'Infrastructure condition', 'Parent involvement'],
      },
      {
        heading: '8. Impact Analysis',
        fields: ['Impact on learning', 'Impact on future opportunities', 'Social impact'],
      },
      {
        heading: '9. Student Intervention',
        fields: ['Activity conducted', 'Target group', 'Number of participants', 'Immediate outcomes'],
      },
      {
        heading: '10. Recommendations',
        fields: ['Short-term solutions', 'Long-term solutions', 'School/government suggestions'],
      },
      {
        heading: '11. Conclusion',
        fields: ['Summary', 'Future scope'],
      },
    ],
  },

  /* ── 12. SKILL IDENTIFICATION & DEVELOPMENT ──────────────── */
  'Skill Development': {
    title: 'SKILL IDENTIFICATION & DEVELOPMENT – CASE STUDY REPORT',
    sections: [
      {
        heading: '1. Basic Details',
        fields: ['Student Name', 'Roll Number', 'Village/Area', 'District', 'State', 'Domain', 'Problem Statement', 'Duration'],
      },
      {
        heading: '2. Problem Description',
        fields: ['What is the selected skill-related issue?', 'Where is it observed (youth/students/community)?', 'Why is it important?'],
      },
      {
        heading: '3. Stakeholders Covered',
        fields: ['Youth/Students', 'Parents', 'Trainers', 'Employers/Officials'],
      },
      {
        heading: '4. Survey Summary',
        fields: ['Total respondents', 'Stakeholder-wise distribution'],
      },
      {
        heading: '5. Data Analysis',
        tableHeaders: ['Stakeholder', 'No. of Questions', 'Yes (%)', 'No (%)', 'Key Issue'],
        tableRows: ['Youth', 'Parents', 'Others'],
      },
      {
        heading: '6. Key Findings',
        fields: ['Major problems identified', 'Impact of the Problems', 'Root causes'],
      },
      {
        heading: '7. Field Observations',
        fields: ['Skill awareness level', 'Training availability', 'Confidence levels', 'Employment trends'],
      },
      {
        heading: '8. Impact Analysis',
        fields: ['Impact on employment', 'Impact on education', 'Social impact'],
      },
      {
        heading: '9. Student Intervention',
        fields: ['Activity conducted', 'Target group', 'Number of participants', 'Immediate outcomes'],
      },
      {
        heading: '10. Recommendations',
        fields: ['Short-term solutions', 'Long-term solutions', 'Government/institution suggestions'],
      },
      {
        heading: '11. Conclusion',
        fields: ['Summary', 'Future scope'],
      },
    ],
  },

  /* ── 13. SPORTS & WELLNESS ENGAGEMENT ───────────────────── */
  'Sports': {
    title: 'SPORTS & WELLNESS ENGAGEMENT – CASE STUDY REPORT',
    sections: [
      { heading: '1. Basic Details', fields: ['Student Name', 'Roll Number', 'Village/Area', 'District', 'State', 'Domain', 'Problem Statement', 'Duration'] },
      { heading: '2. Problem Description', fields: ['What is the selected issue?', 'Where is it observed (youth/community)?', 'Why is it important?'] },
      { heading: '3. Stakeholders Covered', fields: ['Youth/Students', 'Parents', 'Coaches/Trainers', 'Teachers/Health Workers'] },
      { heading: '4. Survey Summary', fields: ['Total respondents', 'Stakeholder-wise distribution'] },
      { heading: '5. Data Analysis', tableHeaders: ['Stakeholder', 'No. of Questions', 'Yes (%)', 'No (%)', 'Key Issue'], tableRows: ['Youth', 'Parents', 'Others'] },
      { heading: '6. Key Findings', fields: ['Major problems identified', 'Impact of the Problems', 'Root causes'] },
      { heading: '7. Field Observations', fields: ['Participation levels', 'Facility condition', 'Lifestyle habits', 'Awareness level'] },
      { heading: '8. Impact Analysis', fields: ['Physical health impact', 'Mental health impact', 'Social impact'] },
      { heading: '9. Student Intervention', fields: ['Activity conducted', 'Target group', 'Number of participants', 'Immediate outcomes'] },
      { heading: '10. Recommendations', fields: ['Short-term solutions', 'Long-term solutions', 'Community/government suggestions'] },
      { heading: '11. Conclusion', fields: ['Summary', 'Future scope'] },
    ],
  },

  /* ── 14. GREEN INNOVATIONS & TREE PLANTATION ─────────────── */
  'Green Innovations': {
    title: 'GREEN INNOVATIONS & TREE PLANTATION – CASE STUDY REPORT',
    sections: [
      { heading: '1. Basic Details', fields: ['Student Name', 'Roll Number', 'Village/Area', 'District', 'State', 'Domain', 'Problem Statement', 'Duration'] },
      { heading: '2. Problem Description', fields: ['What is the selected environmental issue?', 'Where is it observed?', 'Why is it important?'] },
      { heading: '3. Stakeholders Covered', fields: ['Residents', 'Farmers', 'Students', 'Officials/NGOs'] },
      { heading: '4. Survey Summary', fields: ['Total respondents', 'Stakeholder-wise distribution'] },
      { heading: '5. Data Analysis', tableHeaders: ['Stakeholder', 'No. of Questions', 'Yes (%)', 'No (%)', 'Key Issue'], tableRows: ['Residents', 'Farmers', 'Others'] },
      { heading: '6. Key Findings', fields: ['Major problems identified', 'Impact of the Problems', 'Root causes'] },
      { heading: '7. Field Observations', fields: ['Tree cover status', 'Maintenance practices', 'Awareness levels', 'Environmental conditions'] },
      { heading: '8. Impact Analysis', fields: ['Environmental impact', 'Social impact', 'Sustainability impact'] },
      { heading: '9. Student Intervention', fields: ['Activity conducted', 'Target group', 'Number of participants', 'Immediate outcomes'] },
      { heading: '10. Recommendations', fields: ['Short-term solutions', 'Long-term solutions', 'Government/community suggestions'] },
      { heading: '11. Conclusion', fields: ['Summary', 'Future scope'] },
    ],
  },

  /* ── 15. MENTAL HEALTH & WELL-BEING ─────────────────────── */
  'Mental Health': {
    title: 'MENTAL HEALTH & WELL-BEING – CASE STUDY REPORT',
    sections: [
      { heading: '1. Basic Details', fields: ['Student Name', 'Roll Number', 'Village/Area', 'Institution', 'District', 'State', 'Domain', 'Problem Statement', 'Duration'] },
      { heading: '2. Problem Description', fields: ['What is the selected mental health issue?', 'Where is it observed?', 'Why is it important?'] },
      { heading: '3. Stakeholders Covered', fields: ['Students/Youth', 'Parents', 'Teachers', 'Health Workers/Counselors'] },
      { heading: '4. Survey Summary', fields: ['Total respondents', 'Stakeholder-wise distribution'] },
      { heading: '5. Data Analysis', tableHeaders: ['Stakeholder', 'No. of Questions', 'Yes (%)', 'No (%)', 'Key Issue'], tableRows: ['Youth', 'Parents', 'Others'] },
      { heading: '6. Key Findings', fields: ['Major problems identified', 'Impact of the Problems', 'Root causes'] },
      { heading: '7. Field Observations', fields: ['Stress levels', 'Awareness levels', 'Support systems', 'Behavioral patterns'] },
      { heading: '8. Impact Analysis', fields: ['Impact on mental health', 'Impact on academic/work performance', 'Social impact'] },
      { heading: '9. Student Intervention', fields: ['Activity conducted', 'Target group', 'Number of participants', 'Immediate outcomes'] },
      { heading: '10. Recommendations', fields: ['Short-term solutions', 'Long-term solutions', 'Institutional/community suggestions'] },
      { heading: '11. Conclusion', fields: ['Summary', 'Future scope'] },
    ],
  },

  /* ── 16. LIVELIHOOD & ENTREPRENEURSHIP ──────────────────── */
  'Livelihood': {
    title: 'LIVELIHOOD & ENTREPRENEURSHIP – CASE STUDY REPORT',
    sections: [
      { heading: '1. Basic Details', fields: ['Student Name', 'Roll Number', 'Village/Area', 'District', 'State', 'Domain', 'Problem Statement', 'Duration'] },
      { heading: '2. Problem Description', fields: ['What is the selected livelihood issue?', 'Where is it observed?', 'Why is it important?'] },
      { heading: '3. Stakeholders Covered', fields: ['Youth/Job Seekers', 'Parents/Families', 'Entrepreneurs', 'Officials/Banks/Trainers'] },
      { heading: '4. Survey Summary', fields: ['Total respondents', 'Stakeholder-wise distribution'] },
      { heading: '5. Data Analysis', tableHeaders: ['Stakeholder', 'No. of Questions', 'Yes (%)', 'No (%)', 'Key Issue'], tableRows: ['Youth', 'Families', 'Others'] },
      { heading: '6. Key Findings', fields: ['Major problems identified', 'Impact of the Problems', 'Root causes'] },
      { heading: '7. Field Observations', fields: ['Employment patterns', 'Skill levels', 'Business activities', 'Financial access'] },
      { heading: '8. Impact Analysis', fields: ['Economic impact', 'Social impact', 'Employment impact'] },
      { heading: '9. Student Intervention', fields: ['Activity conducted', 'Target group', 'Number of participants', 'Immediate outcomes'] },
      { heading: '10. Recommendations', fields: ['Short-term solutions', 'Long-term solutions', 'Government/community suggestions'] },
      { heading: '11. Conclusion', fields: ['Summary', 'Future scope'] },
    ],
  },

  /* ── 17. CULTURAL HERITAGE & NARRATIVES ─────────────────── */
  'Cultural Heritage': {
    title: 'CULTURAL HERITAGE & NARRATIVES – CASE STUDY REPORT',
    sections: [
      { heading: '1. Basic Details', fields: ['Student Name', 'Roll Number', 'Village/Area', 'District', 'State', 'Domain', 'Problem Statement', 'Duration'] },
      { heading: '2. Problem Description', fields: ['What is the selected cultural issue?', 'Where is it observed?', 'Why is it important?'] },
      { heading: '3. Stakeholders Covered', fields: ['Elders', 'Youth/Students', 'Leaders', 'Artisans/Families'] },
      { heading: '4. Survey Summary', fields: ['Total respondents', 'Stakeholder-wise distribution'] },
      { heading: '5. Data Analysis', tableHeaders: ['Stakeholder', 'No. of Questions', 'Yes (%)', 'No (%)', 'Key Issue'], tableRows: ['Elders', 'Youth', 'Others'] },
      { heading: '6. Key Findings', fields: ['Major problems identified', 'Impact of the Problems', 'Root causes'] },
      { heading: '7. Field Observations', fields: ['Cultural practices', 'Participation levels', 'Knowledge transfer', 'Language usage'] },
      { heading: '8. Impact Analysis', fields: ['Cultural impact', 'Social impact', 'Heritage preservation impact'] },
      { heading: '9. Student Intervention', fields: ['Activity conducted', 'Target group', 'Number of participants', 'Immediate outcomes'] },
      { heading: '10. Recommendations', fields: ['Short-term solutions', 'Long-term solutions', 'Community/government suggestions'] },
      { heading: '11. Conclusion', fields: ['Summary', 'Future scope'] },
    ],
  },

  /* ── 18. DISASTER PREPAREDNESS & RESILIENCE ─────────────── */
  'Disaster Preparedness': {
    title: 'DISASTER PREPAREDNESS & RESILIENCE – CASE STUDY REPORT',
    sections: [
      { heading: '1. Basic Details', fields: ['Student Name', 'Roll Number', 'Village/Area', 'District', 'State', 'Domain', 'Problem Statement', 'Duration'] },
      { heading: '2. Problem Description', fields: ['What is the selected disaster-related issue?', 'Where is it observed?', 'Why is it important?'] },
      { heading: '3. Stakeholders Covered', fields: ['Residents', 'Students', 'Officials', 'Volunteers/Health Workers'] },
      { heading: '4. Survey Summary', fields: ['Total respondents', 'Stakeholder-wise distribution'] },
      { heading: '5. Data Analysis', tableHeaders: ['Stakeholder', 'No. of Questions', 'Yes (%)', 'No (%)', 'Key Issue'], tableRows: ['Residents', 'Students', 'Others'] },
      { heading: '6. Key Findings', fields: ['Major problems identified', 'Impact of the Problems', 'Root causes'] },
      { heading: '7. Field Observations', fields: ['Risk zones', 'Preparedness levels', 'Infrastructure condition', 'Awareness levels'] },
      { heading: '8. Impact Analysis', fields: ['Risk impact', 'Safety impact', 'Community resilience impact'] },
      { heading: '9. Student Intervention', fields: ['Activity conducted', 'Target group', 'Number of participants', 'Immediate outcomes'] },
      { heading: '10. Recommendations', fields: ['Short-term solutions', 'Long-term solutions', 'Government/community suggestions'] },
      { heading: '11. Conclusion', fields: ['Summary', 'Future scope'] },
    ],
  },

  /* ── 19. RENEWABLE ENERGY & SUSTAINABILITY ───────────────── */
  'Renewable Energy': {
    title: 'RENEWABLE ENERGY & SUSTAINABILITY – CASE STUDY REPORT',
    sections: [
      { heading: '1. Basic Details', fields: ['Student Name', 'Roll Number', 'Village/Area', 'District', 'State', 'Domain', 'Problem Statement', 'Duration'] },
      { heading: '2. Problem Description', fields: ['What is the selected energy-related issue?', 'Where is it observed?', 'Why is it important?'] },
      { heading: '3. Stakeholders Covered', fields: ['Households', 'Students', 'Technicians/Vendors', 'Officials/Banks'] },
      { heading: '4. Survey Summary', fields: ['Total respondents', 'Stakeholder-wise distribution'] },
      { heading: '5. Data Analysis', tableHeaders: ['Stakeholder', 'No. of Questions', 'Yes (%)', 'No (%)', 'Key Issue'], tableRows: ['Households', 'Students', 'Others'] },
      { heading: '6. Key Findings', fields: ['Major problems identified', 'Impact of the Problems', 'Root causes'] },
      { heading: '7. Field Observations', fields: ['Energy usage patterns', 'Renewable adoption levels', 'Awareness levels', 'Sustainability practices'] },
      { heading: '8. Impact Analysis', fields: ['Environmental impact', 'Economic impact', 'Social impact'] },
      { heading: '9. Student Intervention', fields: ['Activity conducted', 'Target group', 'Number of participants', 'Immediate outcomes'] },
      { heading: '10. Recommendations', fields: ['Short-term solutions', 'Long-term solutions', 'Government/community suggestions'] },
      { heading: '11. Conclusion', fields: ['Summary', 'Future scope'] },
    ],
  },

  /* ── 20. ENERGY UTILIZATION & EFFICIENCY ────────────────── */
  'Energy Utilization': {
    title: 'ENERGY UTILIZATION & EFFICIENCY – CASE STUDY REPORT',
    sections: [
      { heading: '1. Basic Details', fields: ['Student Name', 'Roll Number', 'Village/Area', 'District', 'State', 'Domain', 'Problem Statement', 'Duration'] },
      { heading: '2. Problem Description', fields: ['What is the selected energy issue?', 'Where is it observed?', 'Why is it important?'] },
      { heading: '3. Stakeholders Covered', fields: ['Households', 'Students', 'Shop Owners/Institutions', 'Officials/Electricity Staff'] },
      { heading: '4. Survey Summary', fields: ['Total respondents', 'Stakeholder-wise distribution'] },
      { heading: '5. Data Analysis', tableHeaders: ['Stakeholder', 'No. of Questions', 'Yes (%)', 'No (%)', 'Key Issue'], tableRows: ['Households', 'Students', 'Others'] },
      { heading: '6. Key Findings', fields: ['Major problems identified', 'Impact of the Problems', 'Root causes'] },
      { heading: '7. Field Observations', fields: ['Consumption patterns', 'Energy wastage', 'Appliance usage', 'Awareness levels'] },
      { heading: '8. Impact Analysis', fields: ['Economic impact (electricity cost)', 'Environmental impact', 'Behavioral impact'] },
      { heading: '9. Student Intervention', fields: ['Activity conducted', 'Target group', 'Number of participants', 'Immediate outcomes'] },
      { heading: '10. Recommendations', fields: ['Short-term solutions', 'Long-term solutions', 'Community/government suggestions'] },
      { heading: '11. Conclusion', fields: ['Summary', 'Future scope'] },
    ],
  },

  /* ── FALLBACK (generic) ─────────────────────────────────── */

  'Default': {
    title: 'CASE STUDY REPORT',
    sections: [
      {
        heading: '1. Basic Information',
        fields: ['Student Name', 'Roll Number', 'Village/Area', 'District', 'Domain', 'Problem Statement', 'Duration'],
      },
      {
        heading: '2. Problem Description',
        fields: ['What is the issue?', 'Where is it observed?'],
      },
      {
        heading: '3. Stakeholders Covered',
        fields: ['Stakeholder 1', 'Stakeholder 2', 'Stakeholder 3'],
      },
      {
        heading: '4. Survey Summary',
        fields: ['Total respondents', 'Stakeholder-wise distribution'],
      },
      {
        heading: '5. Data Analysis',
        tableHeaders: ['Stakeholder', 'No. of Questions', 'Yes (%)', 'No (%)', 'Key Issue'],
        tableRows: ['Stakeholder 1', 'Stakeholder 2', 'Stakeholder 3'],
      },
      {
        heading: '6. Key Findings',
        fields: ['Major problems identified', 'Impact of the Problems', 'Root causes'],
      },
      {
        heading: '7. Field Observations',
        fields: ['Physical observations', 'Environmental conditions', 'Behavioral observations'],
      },
      {
        heading: '8. Impact Analysis',
        fields: ['Impact on daily life', 'Economic impact', 'Health/social impact'],
      },
      {
        heading: '9. Student Intervention',
        fields: ['Activity conducted', 'People involved', 'Immediate outcome'],
      },
      {
        heading: '10. Suggestions & Recommendations',
        fields: ['Short-term solutions', 'Long-term improvements'],
      },
      {
        heading: '11. Conclusion',
        fields: ['Summary of findings', 'Future scope'],
      },
    ],
  },
};

/**
 * Resolve template for a domain string (case-insensitive fuzzy match).
 * Falls back to 'Default' if no match found.
 */
export function getTemplate(domain) {
  if (!domain) return CASE_STUDY_TEMPLATES['Default'];
  const d = domain.toLowerCase();
  const key = Object.keys(CASE_STUDY_TEMPLATES).find(k =>
    d.includes(k.toLowerCase()) || k.toLowerCase().includes(d)
  );
  return CASE_STUDY_TEMPLATES[key] || CASE_STUDY_TEMPLATES['Default'];
}
