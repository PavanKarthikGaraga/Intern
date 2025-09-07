'use client';
import Image from 'next/image';
import './page.css';
import { useState } from 'react';

export default function DomainAreas() {
  const [showMore, setShowMore] = useState(false);
  const domains = [
    { name: "Health and Hygiene", image: "/image.png" },
    { name: "Village Infrastructure", image: "/image.png" },
    { name: "Water Conservation", image: "/image.png" },
    { name: "Energy Utilization & Efficiency", image: "/image.png" },
    { name: "Community Actions", image: "/image.png" },
    { name: "Agriculture", image: "/image.png" },
    { name: "Water and Sanitation", image: "/image.png" },
    { name: "Waste Management", image: "/image.png" },
    { name: "Digital Literacy & ICT", image: "/image.png" },
    { name: "Women Empowerment & Gender Equality", image: "/image.png" },
    { name: "Renewable Energy & Sustainability", image: "/image.png" },
    { name: "Nutrition & Food Security", image: "/image.png" },
    { name: "Disaster Preparedness & Resilience", image: "/image.png" },
    { name: "Cultural Heritage & Narratives", image: "/image.png" },
    { name: "Green Innovations & Tree Plantation", image: "/image.png" },
    { name: "Livelihood & Entrepreneurship", image: "/image.png" },
    { name: "Rural/Urban Education", image: "/image.png" },
    { name: "Sports & Wellness Engagement", image: "/image.png" },
    { name: "Skill Identification & Development", image: "/image.png" },
    { name: "Mental Health & Well-Being", image: "/image.png" }
  ];
  

  return (
    <section className="domain-areas">
      <div className="container">
        <div className="section-header">
          <h2>Ares of Work</h2>
          <p>Specialized areas where our graduates create lasting change</p>
        </div>

        <div className="domains-grid">
          {domains.slice(0, showMore ? domains.length : 10).map((domain, index) => (
            <div key={index} className="domain-card">
              <div className="domain-image">
                <Image
                  src={domain.image}
                  alt={domain.name}
                  width={300}
                  height={300}
                  className="domain-img"
                />
              </div>
              <h3>{domain.name}</h3>
            </div>
          ))}
        </div>
          <div className='showmore-container'>
            <button className='showmore' onClick={() => setShowMore(!showMore)}>{showMore ? "Show Less" : "Show More"}</button>
          </div>
      </div>
    </section>
  );
}
