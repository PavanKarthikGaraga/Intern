'use client';
import { useState, useEffect } from 'react';
import Header from './components/ui/header/page';
import Hero from './components/ui/hero/page';
import ImpactStats from './components/ui/impact-stats/page';
import ProgramOverview from './components/ui/program-overview/page';
import DomainAreas from './components/ui/domain-areas/page';
import ProgramStructure from './components/ui/program-structure/page';
import ParticipationModes from './components/ui/participation-modes/page';
import Timeline from './components/ui/timeline/page';
import CTASection from './components/ui/cta-section/page';
import Footer from './components/ui/footer/page';
import SocialImpactLoader from './components/animation/animation';
import './page.css';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Hide loader after animation completes (3 seconds)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SocialImpactLoader />;
  }

  return (
    <div className="homepage">
      <Header />
      <section id="hero">
        <Hero />
      </section>
      <ImpactStats />
      {/* <ProgramOverview /> */}
      <section id="domain-areas">
        <DomainAreas />
      </section>
      <section id="program-structure">
        <ProgramStructure />
      </section>
      <section id="participation-modes">
        <ParticipationModes />
      </section>
      <section id="timeline">
        <Timeline />
      </section>
      <section id="cta-section">
        <CTASection />
      </section>
      <Footer />
    </div>
  );
}