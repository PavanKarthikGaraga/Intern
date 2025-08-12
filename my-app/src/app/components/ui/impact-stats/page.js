'use client';
import { 
  CheckCircle,
  Target,
  Users,
  Award
} from 'lucide-react';
import './page.css';

export default function ImpactStats() {
  const impactStats = [
    {
      number: "4,800+",
      label: "Students Completed",
      description: "Successfully finished program",
      icon: CheckCircle
    },
    {
      number: "20+",
      label: "Domain Areas",
      description: "Impact sectors covered",
      icon: Target
    },
    {
      number: "150+",
      label: "Faculty Mentors",
      description: "Expert guidance provided",
      icon: Users
    },
    {
      number: "100+",
      label: "Villages Impacted",
      description: "Communities transformed",
      icon: Award
    }
  ];

  return (
    <section id="impact-stats" className="impact-stats">
      <div className="container">
        <div className="stats-grid">
          {impactStats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon">
                <stat.icon size={32} />
              </div>
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-description">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
