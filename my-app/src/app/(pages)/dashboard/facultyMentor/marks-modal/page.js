'use client'
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import React from 'react';

const MarksModal = dynamic(() => import('../components/students/MarksModal'), { ssr: false });

export default function MarksModalPage() {
  const searchParams = useSearchParams();
  const day = parseInt(searchParams.get('day'), 10);
  const initialMarks = parseFloat(searchParams.get('initialMarks')) || 0;

  const handleSave = (totalMarks) => {
    if (window.opener) {
      window.opener.postMessage({ type: 'MARKS_SAVED', day, totalMarks }, '*');
    }
    window.close();
  };

//   const url = `/dashboard/marks-modal?day=${day}&initialMarks=${initialMarks}`;

  return (
    <MarksModal
      day={day}
      onClose={() => window.close()}
      onSave={handleSave}
      initialMarks={initialMarks}
    />
  );
} 