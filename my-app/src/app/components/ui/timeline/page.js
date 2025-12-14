'use client';
import { CheckCircle } from 'lucide-react';
import './page.css';

export default function Timeline() {
  const timelineData = [
    {
      slot: "Slot 1",
      date: "May 11-17, 2024",
      students: "1,200 students",
      satisfaction: "95% satisfaction"
    },
    {
      slot: "Slot 2",
      date: "July 15-21, 2024",
      students: "1,200 students",
      satisfaction: "97% satisfaction"
    },
    {
      slot: "Slot 3",
      date: "September 10-16, 2024",
      students: "1,200 students",
      satisfaction: "96% satisfaction"
    },
    {
      slot: "Slot 4",
      date: "November 12-18, 2024",
      students: "1,200 students",
      satisfaction: "98% satisfaction"
    }
  ];

  return (
    <section id="timeline" className="timeline-section">
      <div className="container">
        <div className="section-header">
          <h2>Program Timeline</h2>
          <p>Four successful program slots completed in 2024-2025</p>
        </div>

        <div className="timeline-horizontal">
          {timelineData.map((item, index) => (
            <div key={index} className="timeline-step">
              <div className="timeline-card">
                <div className="timeline-marker">
                  <CheckCircle size={24} />
                </div>
                <div className="timeline-content">
                  <h3>{item.slot}</h3>
                  <p className="timeline-date">{item.date}</p>
                  <p className="timeline-stats">{item.students}</p>
                  <p className="timeline-satisfaction">{item.satisfaction}</p>
                </div>
              </div>
              {index < timelineData.length - 1 && <div className="timeline-connector"></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
