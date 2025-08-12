'use client';
import { CheckCircle } from 'lucide-react';
import './page.css';

export default function Timeline() {
  return (
    <section id="timeline" className="timeline-section">
      <div className="container">
        <div className="section-header">
          <h2>Program Completion Timeline 2024-2025</h2>
          <p>Successfully completed four program slots with outstanding results</p>
        </div>
        
        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-marker completed">
              <CheckCircle size={24} />
            </div>
            <div className="timeline-content">
              <h3>Slot 1 - Completed</h3>
              <p className="timeline-date">May 11-17, 2024</p>
              <p className="completion-status">1,200 students completed successfully</p>
              <p className="impact-metric">95% satisfaction rate</p>
            </div>
          </div>
          
          <div className="timeline-item">
            <div className="timeline-marker completed">
              <CheckCircle size={24} />
            </div>
            <div className="timeline-content">
              <h3>Slot 2 - Completed</h3>
              <p className="timeline-date">July 15-21, 2024</p>
              <p className="completion-status">1,200 students completed successfully</p>
              <p className="impact-metric">97% satisfaction rate</p>
            </div>
          </div>
          
          <div className="timeline-item">
            <div className="timeline-marker completed">
              <CheckCircle size={24} />
            </div>
            <div className="timeline-content">
              <h3>Slot 3 - Completed</h3>
              <p className="timeline-date">September 10-16, 2024</p>
              <p className="completion-status">1,200 students completed successfully</p>
              <p className="impact-metric">96% satisfaction rate</p>
            </div>
          </div>
          
          <div className="timeline-item">
            <div className="timeline-marker completed">
              <CheckCircle size={24} />
            </div>
            <div className="timeline-content">
              <h3>Slot 4 - Completed</h3>
              <p className="timeline-date">November 12-18, 2024</p>
              <p className="completion-status">1,200 students completed successfully</p>
              <p className="impact-metric">98% satisfaction rate</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
