'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import './page.css';

export default function Header() {
  const [showNavbar, setShowNavbar] = useState(false);

  useEffect(() => {
    let lastScrollY = 0;
    
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const scrollDirection = scrollY > lastScrollY ? 'down' : 'up';
      
      // Show navbar when scrolling down past 100px, or when scrolling up and past 50px
      if (scrollDirection === 'down' && scrollY > 100) {
        setShowNavbar(true);
      } else if (scrollDirection === 'up' && scrollY > 50) {
        setShowNavbar(true);
      } else if (scrollY <= 50) {
        setShowNavbar(false);
      }
      
      lastScrollY = scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`header ${showNavbar ? 'visible' : ''}`}>
      <div className="header-content">
        <div className="logo-section">
          <h1>Social Internship</h1>
        </div>
        <nav className="nav-links">
          <Link href="/auth/login" className="nav-link">View Dashboard</Link>
        </nav>
      </div>
    </header>
  );
}
