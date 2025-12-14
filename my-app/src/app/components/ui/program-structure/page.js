'use client';
import {
  CheckCircle,
  TrendingUp,
  Award
} from 'lucide-react';
import './page.css';

export default function ProgramStructure() {
  const achievements = [
    {
      icon: CheckCircle,
      title: "Activities Completed",
      stat: "100%",
      label: "Completion Rate",
      color: "#10b981"
    },
    {
      icon: TrendingUp,
      title: "Assessment Results",
      stat: "95%",
      label: "Engagement",
      color: "#f59e0b"
    },
    {
      icon: Award,
      title: "Learning Outcomes",
      stat: "4,800+",
      label: "Certificates",
      color: "#8b5cf6"
    }
  ];

  const highlights = [
    "Domain-specific field work (1.5-3 hours)",
    "Cultural heritage tasks (LIPI)",
    "10,000+ community surveys",
    "Daily progress tracking",
    "Faculty mentor guidance",
    "Peer leadership development"
  ];

  return (
    <section className="program-structure">
      <div className="container">
        <div className="section-header">
          <h2>Program Achievements</h2>
          <p>Measurable impact from our comprehensive 7-day implementation</p>
        </div>

        <div className="achievements-compact">
          <div className="stats-grid">
            {achievements.map((achievement, index) => (
              <div key={index} className="stat-card">
                <div className="stat-icon">
                  <achievement.icon size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-number" style={{ color: achievement.color }}>
                    {achievement.stat}
                  </div>
                  <div className="stat-label">{achievement.label}</div>
                  <div className="stat-title">{achievement.title}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="highlights-section">
            <h3>Key Highlights</h3>
            <div className="highlights-grid">
              {highlights.map((highlight, index) => (
                <div key={index} className="highlight-item">
                  <CheckCircle size={16} />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
