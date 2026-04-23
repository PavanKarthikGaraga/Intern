'use client'
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import React, { Suspense } from 'react';

const MarksModal = dynamic(() => import('../MarksModal'), { ssr: false });

function MarksModalContent() {
  const searchParams = useSearchParams();
  const day = parseInt(searchParams.get('day'), 10);
  const initialMarks = parseFloat(searchParams.get('initialMarks')) || 0;

  const handleSave = (totalMarks) => {
    if (window.opener) {
      window.opener.postMessage({ type: 'MARKS_SAVED', day, totalMarks }, '*');
    }
    window.close();
  };

  return (
    <MarksModal
      day={day}
      onClose={() => window.close()}
      onSave={handleSave}
      initialMarks={initialMarks}
    />
  );
}

export default function MarksModalPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MarksModalContent />
    </Suspense>
  );
} 