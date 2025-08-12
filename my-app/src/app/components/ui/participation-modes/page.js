'use client';
import { 
  HomeIcon,
  School,
  TreePine,
  Users
} from 'lucide-react';
import './page.css';

export default function ParticipationModes() {
  return (
    <section className="participation-modes">
      <div className="container">
        <div className="section-header">
          <h2>Program Implementation Success</h2>
          <p>Multiple participation modes proved effective for diverse student needs</p>
        </div>
        
        <div className="modes-grid">
          <div className="mode-card">
            <div className="mode-icon">
              <HomeIcon size={48} />
            </div>
            <h3>Remote (Hometown)</h3>
            <p>Students worked in their local communities while staying at home. This mode proved highly effective for native area impact creation.</p>
            <div className="mode-capacity">3,600 students completed successfully</div>
            <div className="mode-success">95% completion rate</div>
          </div>
          
          <div className="mode-card">
            <div className="mode-icon">
              <School size={48} />
            </div>
            <h3>In-Campus</h3>
            <p>Campus-based students worked with adopted villages nearby. Created strong collaborative environment with excellent peer support.</p>
            <div className="mode-capacity">1,200 students completed successfully</div>
            <div className="mode-success">98% completion rate</div>
          </div>
          
          <div className="mode-card">
            <div className="mode-icon">
              <TreePine size={48} />
            </div>
            <h3>In-Village</h3>
            <p>Immersive village living provided the most intensive community experience. Generated deepest impact and strongest relationships.</p>
            <div className="mode-capacity">Limited cohort - 100% completion</div>
            <div className="mode-success">Outstanding impact scores</div>
          </div>
        </div>
      </div>
    </section>
  );
}
