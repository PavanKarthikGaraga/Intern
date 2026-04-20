'use client';
import { 
  HeartPulse, Sprout, Droplet, Building2, Zap, 
  Users, Waves, Trash2, Monitor, Venus,
  Sun, Apple, ShieldAlert, Landmark, TreePine,
  Briefcase, GraduationCap, Trophy, Lightbulb, Brain
} from 'lucide-react';
import './page.css';

export default function DomainAreas() {
  const domains = [
    { name: "Health and Hygiene", icon: <HeartPulse className="domain-icon" size={24} /> },
    { name: "Agriculture", icon: <Sprout className="domain-icon" size={24} /> },
    { name: "Water Conservation", icon: <Droplet className="domain-icon" size={24} /> },
    { name: "Village Infrastructure", icon: <Building2 className="domain-icon" size={24} /> },
    { name: "Energy Utilization & Efficiency", icon: <Zap className="domain-icon" size={24} /> },
    { name: "Community Actions", icon: <Users className="domain-icon" size={24} /> },
    { name: "Water and Sanitation", icon: <Waves className="domain-icon" size={24} /> },
    { name: "Waste Management", icon: <Trash2 className="domain-icon" size={24} /> },
    { name: "Digital Literacy & ICT", icon: <Monitor className="domain-icon" size={24} /> },
    { name: "Women Empowerment & Gender Equality", icon: <Venus className="domain-icon" size={24} /> },
    { name: "Renewable Energy & Sustainability", icon: <Sun className="domain-icon" size={24} /> },
    { name: "Nutrition & Food Security", icon: <Apple className="domain-icon" size={24} /> },
    { name: "Disaster Preparedness & Resilience", icon: <ShieldAlert className="domain-icon" size={24} /> },
    { name: "Cultural Heritage & Narratives", icon: <Landmark className="domain-icon" size={24} /> },
    { name: "Green Innovations & Tree Plantation", icon: <TreePine className="domain-icon" size={24} /> },
    { name: "Livelihood & Entrepreneurship", icon: <Briefcase className="domain-icon" size={24} /> },
    { name: "Rural/Urban Education", icon: <GraduationCap className="domain-icon" size={24} /> },
    { name: "Sports & Wellness Engagement", icon: <Trophy className="domain-icon" size={24} /> },
    { name: "Skill Identification & Development", icon: <Lightbulb className="domain-icon" size={24} /> },
    { name: "Mental Health & Well-Being", icon: <Brain className="domain-icon" size={24} /> }
  ];
  

  return (
    <section className="domain-areas">
      <div className="container">
        <div className="section-header">
          <h2>Areas of Work</h2>
          <p>Specialized areas where our graduates create lasting change</p>
        </div>

        <div className="domains-grid">
          {domains.map((domain, index) => (
            <div key={index} className="domain-card horizontal-card">
              <div className="domain-icon-wrapper">
                {domain.icon}
              </div>
              <h3>{domain.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
