'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './page.css';

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    { image: "https://i.imghippo.com/files/ifQ9317VE.jpg" },
    { image: "https://i.imghippo.com/files/dKfd9907aQ.jpg" },
    { image: "https://i.imghippo.com/files/vyg4759qcg.jpg" },
    { image: "https://i.imghippo.com/files/LVeb1941l.jpg" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000); // 4 secs delay

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setCurrentSlide(prev => (prev === 0 ? slides.length - 1 : prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentSlide(prev => (prev + 1) % slides.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [slides.length]);

  return (
    <section className="hero-section">
      <div className="hero-slider">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
          >
            <div className="hero-content">
              <div className="hero-image-container">
                <Image
                  src={slide.image}
                  alt="Social Internship"
                  width={900}
                  height={520}
                  className="slide-image"
                  style={{ width: '100%', height: '520px' }}
                  unoptimized={true}
                />
              </div>
            </div>
          </div>
        ))}
        
        <button 
          className="slide-nav-btn prev-btn" 
          onClick={() => setCurrentSlide(prev => (prev === 0 ? slides.length - 1 : prev - 1))}
        >
          &#10094;
        </button>
        <button 
          className="slide-nav-btn next-btn" 
          onClick={() => setCurrentSlide(prev => (prev + 1) % slides.length)}
        >
          &#10095;
        </button>
      </div>
      
      <div className="hero-indicators">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`indicator ${index === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </section>
  );
}