'use client';
import Link from 'next/link';
import './page.css';

const linkedInPosts = [
  {
    src: "https://www.linkedin.com/embed/feed/update/urn:li:share:7330542494692106242?collapsed=1",

    height: 650,
    width: 550,
    title: "Embedded LinkedIn post 1"
  },
  {
    src: "https://www.linkedin.com/embed/feed/update/urn:li:share:7330542494692106242?collapsed=1",
    height: 650,
    width: 500,
    title: "Embedded LinkedIn post 2"
  },
  {
    src: "https://www.linkedin.com/embed/feed/update/urn:li:share:7330542494692106242?collapsed=1",
    
    height: 650,
    width: 500,
    title: "Embedded LinkedIn post 3"
  },
  {
    src: "https://www.linkedin.com/embed/feed/update/urn:li:share:7330542494692106242?collapsed=1",
    
    height: 650,
    width: 550,
    title: "Embedded LinkedIn post 4"
  }
];

const youtubeVideos = [
  {
    src: "https://www.youtube.com/embed/DbiR0MJ1cJ4?si=qaMuyUHdqcissbE7",
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
    src: "https://www.youtube.com/embed/Sy35g9yTMvs?si=5viTd3vV_KZcI2sz",
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
                <iframe
                  key={idx}
                  src={post.src}
                  height={post.height}
                  width={post.width}
                  frameBorder="0"
                  allowFullScreen=""
                  scrolling="no"
                  title={post.title}
                ></iframe>
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
