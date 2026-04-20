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
    src: "https://www.youtube.com/embed/dBRNF5JyXag",
    width: 450,
    height: 253,
    title: "YouTube video player 1"
  },
  {
    src: "https://www.youtube.com/embed/XJga1BK6pXc?si=iEnRwlrTGxuR-Z4K",
    width: 450,
    height: 253,
    title: "YouTube video player 2"
  },
  {
    src: "https://www.youtube.com/embed/xP4-HeZH8Vg?si=Se5tN21u1aSyIKo-",
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
          </div>
        </div>
      </div>
    </section>
  );
}
