'use client';
import Link from 'next/link';
import './page.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Social Internship</h3>
            <p>KL University&apos;s flagship program for social impact and community engagement.</p>
          </div>
          
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><Link href="#domain-areas">Impact Domains</Link></li>
              <li><Link href="#program-structure">Achievements</Link></li>
              <li><Link href="#timeline">Program Timeline</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Contact</h4>
            <p>Email: sac@kluniversity.in</p>
            <p>KL University</p>
            <p>Vaddeswaram, Guntur</p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 KL University Social Internship. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
