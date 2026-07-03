'use client';
import Link from 'next/link';
import './page.css';

const linkedInPosts = [
  {
    src: "https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7332273260828479488?collapsed=1",
    postUrl: "https://www.linkedin.com/feed/update/urn:li:ugcPost:7332273260828479488",
    height: 650,
    width: 550,
    title: "Shanmukha Ganesh Potlapalli - Social Impact Internship"
  },
  {
    src: "https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7334753454768177152?collapsed=1",
    postUrl: "https://www.linkedin.com/feed/update/urn:li:ugcPost:7334753454768177152",
    height: 650,
    width: 550,
    title: "Deepak Kumar - Social Internship KLU"
  },
  {
    src: "https://www.linkedin.com/embed/feed/update/urn:li:share:7335001791379492865?collapsed=1",
    postUrl: "https://www.linkedin.com/feed/update/urn:li:share:7335001791379492865",
    height: 650,
    width: 550,
    title: "Nikhil Karthik Mothukuri - KLU Social Internship Agriculture"
  },
  {
    src: "https://www.linkedin.com/embed/feed/update/urn:li:share:7334998206042308608?collapsed=1",
    postUrl: "https://www.linkedin.com/feed/update/urn:li:share:7334998206042308608",
    height: 650,
    width: 550,
    title: "Jaya Sravya Kilarapu - KLU Social Internship Agriculture"
  }
];

const youtubeVideos = [
  {
    src: "https://www.youtube.com/embed/c6xbIDqd_N4?si=pOMy-wjYky3NKxbi",
    width: 450,
    height: 253,
    title: "YouTube video player 1"
  },
  {
    src: "https://www.youtube.com/embed/kxaM1sEry9s",
    width: 450,
    height: 253,
    title: "YouTube video player 2"
  },
  {
    src: "https://www.youtube.com/embed/dBRNF5JyXag",
    width: 450,
    height: 253,
    title: "YouTube video player 3"
  },
  {
    src: "https://www.youtube.com/embed/J-qy1RcS8eA",
    width: 450,
    height: 253,
    title: "YouTube video player 4"
  }
];

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
              {linkedInPosts.map((post, idx) => (
                <a 
                  key={idx}
                  href={post.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="linkedin-post-wrapper"
                  style={{ position: 'relative', display: 'inline-block', transition: 'transform 0.2s ease' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {/* Invisible Overlay to catch clicks and redirect */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, cursor: 'pointer' }}></div>
                  
                  <iframe
                    src={post.src}
                    height={post.height}
                    width={post.width}
                    frameBorder="0"
                    allowFullScreen=""
                    scrolling="no"
                    title={post.title}
                    style={{ position: 'relative', zIndex: 1, borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  ></iframe>
                </a>
              ))}
            </div>
            
            {/* YouTube Videos Section */}
            <h3>YouTube Videos</h3>
            <div className="youtube-videos">
              {youtubeVideos.map((video, idx) => (
                <iframe
                  key={idx}
                  width={video.width}
                  height={video.height}
                  src={video.src}
                  title={video.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>
              ))}
            </div>
            
            {/* Rules and Regulations Section */}
            <div className="rules-regulations" style={{ marginTop: '40px', textAlign: 'left', background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3>Rules and Regulations</h3>
              <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: '#334155', lineHeight: '1.6', fontSize: '1.05rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>All students registered should submit all 7 days tasks in their register slot timeline only.</li>
                <li>Students doing a social internship through other organizations or NGOs should submit their final report and a certificate issued by the organization to the Director SAC physically on or before the last slot timeline.</li>
                <li>Students from other organizations should also mail a soft copy to <strong>sac@kluniversity.in</strong> and cc <strong>director_sac@kluniversity.in</strong>.</li>
                <li>Ensure adherence to professional conduct and university guidelines throughout the internship program.</li>
                <li>Failure to submit reports within the timeline may result in disqualification from the program.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
