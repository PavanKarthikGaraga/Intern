'use client';
import Link from 'next/link';
import './page.css';

export default function CTASection() {
  return (
    <section className="cta-section">
      <div className="container">
        <div className="cta-content">
          <h2>Explore Our Success Stories</h2>
          <p>Discover the transformative impact of our completed Social Internship Program. View detailed reports, student testimonials, and community transformation stories.</p>
          
          {/* LinkedIn Posts Section */}
          <div className="social-embeds">
            <h3>LinkedIn Updates</h3>
            <div className="linkedin-posts">
              <iframe 
                src="https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7349762205434724352?collapsed=1" 
                height="650" 
                width="550" 
                frameBorder="0" 
                allowFullScreen="" 
                title="Embedded LinkedIn post 1">
              </iframe>
              <iframe 
                src="https://www.linkedin.com/embed/feed/update/urn:li:share:7330542494692106242?collapsed=1" 
                height="650" 
                width="500" 
                frameBorder="0" 
                allowFullScreen="" 
                title="Embedded LinkedIn post 2">
              </iframe>
              <iframe 
                src="https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7349762205434724352?collapsed=1" 
                height="650" 
                width="500" 
                frameBorder="0" 
                allowFullScreen="" 
                title="Embedded LinkedIn post 3">
              </iframe>
              <iframe 
                src="https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7349762205434724352?collapsed=1" 
                height="650" 
                width="550" 
                frameBorder="0" 
                allowFullScreen="" 
                title="Embedded LinkedIn post 4">
              </iframe>
            </div>
            
            {/* YouTube Videos Section */}
            <h3>YouTube Videos</h3>
            <div className="youtube-videos">
              <iframe 
                width="450" 
                height="253" 
                src="https://www.youtube.com/embed/C2JvTGse4hw?si=cjn1ByB-3FmiQ2oJ" 
                title="YouTube video player 1" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerPolicy="strict-origin-when-cross-origin" 
                allowFullScreen>
              </iframe>
              <iframe 
                width="450" 
                height="253" 
                src="https://www.youtube.com/embed/C2JvTGse4hw?si=cjn1ByB-3FmiQ2oJ" 
                title="YouTube video player 2" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerPolicy="strict-origin-when-cross-origin" 
                allowFullScreen>
              </iframe>
              <iframe 
                width="450" 
                height="253" 
                src="https://www.youtube.com/embed/C2JvTGse4hw?si=cjn1ByB-3FmiQ2oJ" 
                title="YouTube video player 3" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerPolicy="strict-origin-when-cross-origin" 
                allowFullScreen>
              </iframe>
              <iframe 
                width="450" 
                height="253" 
                src="https://www.youtube.com/embed/C2JvTGse4hw?si=cjn1ByB-3FmiQ2oJ" 
                title="YouTube video player 4" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerPolicy="strict-origin-when-cross-origin" 
                allowFullScreen>
              </iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
