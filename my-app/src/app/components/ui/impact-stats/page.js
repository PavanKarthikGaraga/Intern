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
        <div className="section-header">
          <h2>Our Impact in Numbers</h2>
          <p>Measuring our success through tangible results and community transformation</p>
        </div>
        <div className="impact-content">
          
          <div className="program-info">
            <h3>About Our Program</h3>
            <p>
              Our comprehensive internship program bridges the gap between academic learning and real-world impact.
              Through hands-on experience and expert mentorship, students develop practical skills while contributing
              to meaningful community development projects across diverse sectors.
            </p>
            <p>
              With over 150 dedicated faculty mentors guiding participants through 20+ domain areas,
              our program has successfully impacted 100+ villages by fostering sustainable development
              and empowering communities through education and innovation.
            </p>
            <p>
              Join us in creating lasting change and building a brighter future for communities nationwide.
              Every internship is an opportunity to learn, grow, and make a difference.
            </p>
          </div>
          <div className="stats-section">
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
        </div>
      </div>
    </section>
  );
}
