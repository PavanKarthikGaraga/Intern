'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
// import Loader from '../../../../../components/loader/loader';
import toast from 'react-hot-toast';

export default function CompletedStudents({ user }) {
  const [completedStudents, setCompletedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompletedStudents = async () => {
      try {
        setError(null);
        const response = await fetch('/api/dashboard/studentLead/completed-students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user?.username })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch completed students');
        }

        const data = await response.json();
        if (data.success) {
          setCompletedStudents(data.completedStudents);
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
    //return <Loader />;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="completed-students-section">
      <h2>Completed Students</h2>
      <div className="completed-students-list">
        {completedStudents.map((student) => (
          <div key={student.username} className="student-card">
            <h3>{student.name}</h3>
            <p>ID: {student.username}</p>
            <p>Completion Date: {student.completionDate}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
