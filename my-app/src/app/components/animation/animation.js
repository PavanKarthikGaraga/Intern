'use client';
import React, { useState, useEffect } from 'react';
import { 
  Home, 
  BookOpen, 
  Sprout, 
  Droplets, 
  Zap, 
  Users,
  Building2,
  GraduationCap
} from 'lucide-react';
import './animation.css';

export default function SocialImpactLoader() {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out animation before component unmounts
    const timer = setTimeout(() => {
      setFadeOut(true);
    }, 2500); // Start fade out 500ms before the parent component hides it

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`impact-loader ${fadeOut ? 'fade-out' : ''}`}>
      <div className="loader-container">
        {/* Growing Tree Animation */}
        <div className="tree-container">
          {/* Tree Trunk */}
          <div className="tree-trunk"></div>
          
          {/* Tree Branches */}
          <div className="tree-branches">
            <div className="branch branch-1"></div>
            <div className="branch branch-2"></div>
            <div className="branch branch-3"></div>
            <div className="branch branch-4"></div>
          </div>
          
          {/* Tree Leaves with Icons */}
          <div className="tree-leaves">
            <div className="leaf leaf-1">
              <div className="leaf-icon">
                <Home size={16} />
              </div>
            </div>
            <div className="leaf leaf-2">
              <div className="leaf-icon">
                <BookOpen size={16} />
              </div>
            </div>
            <div className="leaf leaf-3">
              <div className="leaf-icon">
                <Sprout size={16} />
              </div>
            </div>
            <div className="leaf leaf-4">
              <div className="leaf-icon">
                <Droplets size={16} />
              </div>
            </div>
            <div className="leaf leaf-5">
              <div className="leaf-icon">
                <Zap size={16} />
              </div>
            </div>
            <div className="leaf leaf-6">
              <div className="leaf-icon">
                <Users size={16} />
              </div>
            </div>
          </div>
          
          {/* Root System */}
          <div className="root-system">
            <div className="root root-1"></div>
            <div className="root root-2"></div>
            <div className="root root-3"></div>
          </div>
          
          {/* Community Elements */}
          <div className="community-elements">
            <div className="village-house house-1">
              <Building2 size={32} />
            </div>
            <div className="village-house house-2">
              <Home size={32} />
            </div>
            <div className="student-figure">
              <GraduationCap size={28} />
            </div>
          </div>
        </div>
        
        {/* Loading Text */}
        <div className="loading-text">
          <span className="loading-word">Growing</span>
          <span className="loading-word">Communities</span>
          <span className="dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>
        
        {/* Progress Indicator */}
        <div className="progress-indicator">
          <div className="progress-bar"></div>
        </div>
      </div>
    </div>
  );
}
