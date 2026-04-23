'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import './page.css';


export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroHeight = window.innerHeight; // 100vh
      const shouldBeScrolled = scrollY >= heroHeight;

      // Debug logging
      console.log('Scroll position:', scrollY, 'Hero height:', heroHeight, 'Should be scrolled:', shouldBeScrolled);

      if (shouldBeScrolled !== isScrolled) {
        setIsScrolled(shouldBeScrolled);
      }
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });

    // Check initial scroll position
    handleScroll();

    return () => window.removeEventListener('scroll', throttledHandleScroll);
  }, [isScrolled]);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const navItems = [
    { name: 'Home', id: 'hero' },
    { name: 'Impact Stats', id: 'impact-stats' },
    { name: 'Domains', id: 'domain-areas' },
    { name: 'Achievements', id: 'program-structure' },
    { name: 'Timeline', id: 'timeline' },
    { name: 'Login', url: '/auth/login', isLoginButton: true },
    { name: 'Register', url: '/register', isButton: true }
  ];

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`} data-scrolled={isScrolled}>
      <div className="header-content">
        <div className="logo-section">
          <Image
            src="/klu.png"
            alt="KLU Logo"
            className="logo-image"
            width={48}
            height={48}
          />
          <h4>Social Internship</h4>
        </div>

        <nav className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
          {navItems.map((item, index) => (
            <button
              key={item.id || index}
              className={`nav-link ${item.isButton ? 'register-btn' : ''} ${item.isLoginButton ? 'login-btn' : ''}`}
              onClick={() => {
                if (item.url) {
                  window.location.href = item.url;
                } else {
                  scrollToSection(item.id);
                }
              }}
            >
              {item.name}
            </button>
          ))}
        </nav>

        <button
          className="mobile-menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
}
