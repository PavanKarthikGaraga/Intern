'use client';
/**
 * Live MyGov quizzes/pledges for a daily-task MyGov section.
 *
 * Quizzes come back already filtered to those still open (by their MyGov end date) and
 * sorted by most time remaining. Each day gets a different slice of the lists so the
 * same student isn't given identical tasks on Day 3, 4, 5 and 6.
 *
 * `fallback` ({ quizzes, pledges }) is only used if the portal's API can't be reached.
 */
import { useEffect, useState } from 'react';

const DAY_OFFSET = { 3: 0, 4: 1, 5: 2, 6: 3 };

let request = null; // shared across sections on the page
function loadMyGovTasks() {
  if (!request) {
    request = fetch('/api/mygov-tasks', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => (d.success ? d : Promise.reject(new Error(d.error || 'Failed'))))
      .catch((err) => {
        request = null; // allow a retry next time
        throw err;
      });
  }
  return request;
}

function pickRotating(list, count, offset) {
  if (!Array.isArray(list) || list.length === 0) return [];
  if (list.length <= count) return list.slice();
  const start = (offset * count) % list.length;
  return Array.from({ length: count }, (_, i) => list[(start + i) % list.length]);
}

export function formatMyGovDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

export function useMyGovTasks({ day, quizCount, pledgeCount, fallback }) {
  const [state, setState] = useState({ status: 'loading', data: null });

  useEffect(() => {
    let cancelled = false;
    loadMyGovTasks()
      .then((data) => { if (!cancelled) setState({ status: 'live', data }); })
      .catch(() => { if (!cancelled) setState({ status: 'fallback', data: null }); });
    return () => { cancelled = true; };
  }, []);

  if (state.status !== 'live') {
    return {
      loading: state.status === 'loading',
      live: false,
      quizzes: state.status === 'fallback' ? fallback?.quizzes || [] : [],
      pledges: state.status === 'fallback' ? fallback?.pledges || [] : [],
      fetchedAt: null,
    };
  }

  const offset = DAY_OFFSET[day] ?? 0;
  return {
    loading: false,
    live: true,
    quizzes: pickRotating(state.data.quizzes, quizCount, offset),
    pledges: pickRotating(state.data.pledges, pledgeCount, offset),
    fetchedAt: state.data.fetchedAt,
  };
}
