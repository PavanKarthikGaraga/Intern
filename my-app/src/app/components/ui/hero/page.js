'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './page.css';

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    { image: "/hero/20230516_113003AMByGPSMapCamera.jpeg" },
    { image: "/hero/20230516_30205PMByGPSMapCamera.jpeg" },
    { image: "/hero/20230517_34912PMByGPSMapCamera.jpeg" },
    { image: "/hero/IMG-20250102-WA0166 (1).jpeg" }
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
                  width={1920}
                  height={1080}
                  className="slide-image"
                  unoptimized={true}
                  priority={index === 0}
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