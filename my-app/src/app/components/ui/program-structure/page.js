'use client';
import { 
  ClipboardList,
  BarChart3,
  Target
} from 'lucide-react';
import './page.css';

export default function ProgramStructure() {
  return (
    <section className="program-structure">
      <div className="container">
        <div className="section-header">
          <h2>Program Achievements & Outcomes</h2>
          <p>Documented results from our comprehensive 7-day program implementation</p>
        </div>
        
        <div className="structure-content">
          <div className="structure-info">
            <div className="info-card">
              <h3><ClipboardList size={24} /> Daily Activities Completed</h3>
              <ul>
                <li>Domain-specific field work (1.5-3 hours) - 100% completion rate</li>
                <li>Cultural heritage tasks (LIPI) - Successfully documented</li>
                <li>Community surveys and interviews - 10,000+ responses collected</li>
                <li>Field visits and documentation - Comprehensive reports generated</li>
                <li>Reflection and report writing - Quality submissions achieved</li>
              </ul>
            </div>
            
            <div className="info-card">
              <h3><BarChart3 size={24} /> Assessment & Support Results</h3>
              <ul>
                <li>Daily progress tracking - 95% student engagement</li>
                <li>Faculty mentor guidance - Continuous support provided</li>
                <li>Student lead supervision - Effective peer leadership</li>
                <li>Final report evaluation - 90% quality submissions</li>
                <li>Certificate upon completion - 4,800+ certificates awarded</li>
              </ul>
            </div>
            
            <div className="info-card">
              <h3><Target size={24} /> Learning Outcomes Achieved</h3>
              <ul>
                <li>Real-world problem solving - Practical solutions implemented</li>
                <li>Community engagement skills - Strong relationships built</li>
                <li>Leadership development - 80% showed improvement</li>
                <li>Social impact awareness - Measurable change documented</li>
                <li>Professional documentation - Industry-standard reports</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
