'use client';
import React from 'react';
import { surveyData } from '../dailyTasks/surveyDataShared';
import { FaUsers, FaQuestionCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

export default function SurveyQuestions({ studentData }) {
  const ps = studentData?.problemStatementData?.problem_statement;
  const survey = ps ? surveyData[ps] : null;

  if (!ps) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', background: '#fff', borderRadius: 12, margin: 20, border: '1px solid #fee2e2' }}>
        <h2 style={{ color: '#b91c1c', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <FaExclamationTriangle color="#ef4444" /> Problem Statement Not Selected
        </h2>
        <p style={{ color: '#555', fontSize: '1.1rem' }}>Please select your problem statement in the Overview section to view your specific survey questions.</p>
      </div>
    );
  }

  if (!survey) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', background: '#fff', borderRadius: 12, margin: 20, border: '1px solid #fef3c7' }}>
        <h2 style={{ color: '#b45309', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <FaInfoCircle color="#f59e0b" /> No Survey Data Found
        </h2>
        <p style={{ color: '#555', fontSize: '1.1rem' }}>We couldn&apos;t find the survey questions for your selected problem statement: <br/><br/><strong>{ps}</strong></p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 24, background: '#fff', padding: '24px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h1 style={{ color: '#014a01', fontSize: '1.8rem', fontWeight: 800, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <FaUsers /> Stakeholders & Survey Questions
        </h1>
        <p style={{ fontSize: '1.05rem', color: '#475569', margin: '0 0 16px 0', fontWeight: 500 }}>
          Problem Statement: <span style={{ color: '#014a01', fontWeight: 700 }}>{ps}</span>
        </p>
        <div style={{ padding: '12px 16px', background: '#f0fdfa', borderRadius: 8, borderLeft: '4px solid #0d9488', color: '#0f766e', fontSize: '0.95rem', lineHeight: 1.5 }}>
          <strong>Note:</strong> This page is for <strong>reference only</strong>. You will use these questions to survey the designated stakeholders on <strong>Day 2, 3, and 4</strong> of your internship. Do not record responses here.
        </div>
      </div>

      <div style={{ display: 'grid', gap: '24px' }}>
        {survey.map((stakeholderObj, idx) => (
          <div key={idx} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#014a01', padding: '16px 20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaUsers /> Stakeholder {idx + 1}: {stakeholderObj.stakeholder} (Day {idx + 2})
              </h3>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600 }}>
                {stakeholderObj.questions.length} Questions
              </span>
            </div>
            <div style={{ padding: '24px 20px' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#475569', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FaQuestionCircle color="#64748b" /> Questions to ask:
              </h4>
              <ul style={{ margin: 0, padding: '0 0 0 24px', color: '#334155' }}>
                {stakeholderObj.questions.map((q, qIdx) => (
                  <li key={qIdx} style={{ marginBottom: 12, fontSize: '1rem', lineHeight: 1.5 }}>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
