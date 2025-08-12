'use client';
import Link from 'next/link';
import { 
  Heart, 
  Monitor, 
  UserCheck, 
  Wheat, 
  Droplets, 
  BookOpen,
  TreePine,
  Recycle
} from 'lucide-react';
import './page.css';

export default function DomainAreas() {
  const domains = [
    {
      name: "Health and Hygiene",
      description: "Community wellness and sanitation practices promoted",
      icon: Heart
    },
    {
      name: "Digital Literacy & ICT",
      description: "Digital divide bridged in rural communities",
      icon: Monitor
    },
    {
      name: "Women Empowerment",
      description: "Gender equality and women's participation fostered",
      icon: UserCheck
    },
    {
      name: "Agriculture",
      description: "Sustainable and resilient farming practices promoted",
      icon: Wheat
    },
    {
      name: "Water Conservation",
      description: "Water harvesting methods awareness created",
      icon: Droplets
    },
    {
      name: "Education",
      description: "Quality education access supported in rural areas",
      icon: BookOpen
    },
    {
      name: "Environment",
      description: "Environmental conservation and sustainability initiatives",
      icon: TreePine
    },
    {
      name: "Waste Management",
      description: "Sustainable waste disposal and recycling programs",
      icon: Recycle
    }
  ];

  return (
    <section className="domain-areas">
      <div className="container">
        <div className="section-header">
          <h2>Impact Domains - Proven Results</h2>
          <p>20+ specialized areas where our graduates have created lasting change</p>
        </div>
        
        <div className="domains-grid">
          {domains.map((domain, index) => (
            <div key={index} className="domain-card">
              <div className="domain-icon">
                <domain.icon size={32} />
              </div>
              <h3>{domain.name}</h3>
              <p>{domain.description}</p>
            </div>
          ))}
        </div>
        
        <div className="domains-footer">
          <p>And 14+ more specialized domains with documented success stories...</p>
          <Link href="/auth/login" className="view-all-domains">
            View All Success Stories
          </Link>
        </div>
      </div>
    </section>
  );
}
