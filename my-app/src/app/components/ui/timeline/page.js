'use client';
import { CheckCircle } from 'lucide-react';
import './page.css';

export default function Timeline() {
  const timelineData = [
    { slot: "Slot 1", batch: "Y-25", date: "May 11-17, 2026" },
    { slot: "Slot 2", batch: "Y-25", date: "May 18-24, 2026" },
    { slot: "Slot 3", batch: "Y-25", date: "May 25-31, 2026" },
    { slot: "Slot 4", batch: "Y-25", date: "Jun 1-7, 2026" },
    { slot: "Slot 5", batch: "Y-25", date: "Jun 8-14, 2026" },
    { slot: "Slot 6", batch: "Y-25", date: "Jun 15-21, 2026" },
    { slot: "Slot 7", batch: "Y-24", date: "Jun 22-28, 2026" },
    { slot: "Slot 8", batch: "Y-24", date: "Jun 29-Jul 5, 2026" },
    { slot: "Slot 9", batch: "Y-24", date: "Jul 6-12, 2026" }
  ];

  return (
    <section id="timeline" className="timeline-section">
      <div className="container">
        <div className="section-header">
          <h2>Program Timeline</h2>
          <p>Upcoming program slots for 2026</p>
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
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    marginBottom: '0.35rem',
                    background: item.batch === 'Y-25' ? '#014a01' : '#7a3d00',
                    color: '#fff'
                  }}>{item.batch}</span>
                  <p className="timeline-date">{item.date}</p>
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
