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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hide loader after animation completes (7.5 seconds)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 7500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SocialImpactLoader />;
  }

  return (
    <div className="homepage">
      <Header />
      <Hero />
      <ImpactStats />
      <ProgramOverview />
      <DomainAreas />
      <ProgramStructure />
      <ParticipationModes />
      <Timeline />
      <CTASection />
      <Footer />
    </div>
  );
}