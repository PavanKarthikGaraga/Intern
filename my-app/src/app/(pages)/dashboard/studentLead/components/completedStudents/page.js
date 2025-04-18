'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
// import Loader from '../../../../../components/loader/loader';
import toast from 'react-hot-toast';
import "./page.css";

export default function CompletedStudents({ user }) {
  const [completedStudents, setCompletedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompletedStudents = async () => {
      try {
        setError(null);
        const response = await fetch('/api/dashboard/studentLead/completedStudents', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ username: user?.username })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch completed students');
        }

        const data = await response.json();
        if (data.success) {
          setCompletedStudents(data.completedStudents);
        } else {
          throw new Error(data.error || 'Failed to fetch completed students');
        }
      } catch (err) {
        console.error('Error fetching completed students:', err);
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.username) {
      fetchCompletedStudents();
    }
  }, [user]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (completedStudents.length === 0) {
    return (
      <div className="emptyState">
        <h2>No Completed Students</h2>
        <p>There are no verified students in your group yet.</p>
      </div>
    );
  }

  return (
    <div className="completed-students-section">
      <h2>Completed Students</h2>
      <div className="completed-students-list">
        {completedStudents.map((student) => (
          <div key={student.username} className="student-card">
            <h3>{student.studentName}</h3>
            <p><strong>Username:</strong> {student.username}</p>
            <p><strong>Email:</strong> {student.email}</p>
            <p><strong>Branch:</strong> {student.branch}</p>
            <p><strong>Year:</strong> {student.year}</p>
            <p><strong>Mode:</strong> {student.mode}</p>
            <p><strong>Domain:</strong> {student.selectedDomain}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
