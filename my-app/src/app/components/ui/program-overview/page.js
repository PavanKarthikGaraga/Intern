'use client';
import { 
  Calendar, 
  Globe, 
  GraduationCap, 
  Users
} from 'lucide-react';
import './page.css';

export default function ProgramOverview() {
  const programHighlights = [
    {
      title: "7-Day Intensive Program",
      description: "Completed comprehensive field experience with documented progress and proven outcomes",
      icon: Calendar
    },
    {
      title: "Multiple Impact Modes",
      description: "Successfully implemented through Remote (Hometown), In-Campus, and In-Village approaches",
      icon: Globe
    },
    {
      title: "Academic Credit Earned",
      description: "1 credit awarded to students who completed program requirements and demonstrated impact",
      icon: GraduationCap
    },
    {
      title: "Proven Mentorship Model",
      description: "Faculty mentors and student leads guided participants to measurable success",
      icon: Users
    }
  ];

  return (
    <section className="program-overview">
      <div className="container">
        <div className="section-header">
          <h2>Program Achievements</h2>
          <p>A proven program that has created measurable social change and developed future leaders</p>
        </div>
        
        <div className="overview-grid">
          {programHighlights.map((highlight, index) => (
            <div key={index} className="highlight-card">
              <div className="highlight-icon">
                <highlight.icon size={36} />
              </div>
              <h3>{highlight.title}</h3>
              <p>{highlight.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
