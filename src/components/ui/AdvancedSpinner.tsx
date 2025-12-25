import React, { useEffect, useState } from 'react';

interface AdvancedSpinnerProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
}

const AdvancedSpinner: React.FC<AdvancedSpinnerProps> = ({ 
  progress, 
  size = 240,
  strokeWidth = 6
}) => {
  const [currentProgress, setCurrentProgress] = useState(0);
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (currentProgress / 100) * circumference;

  useEffect(() => {
    // Animate progress smoothly
    const timer = setTimeout(() => {
      setCurrentProgress(progress);
    }, 50);
    
    return () => clearTimeout(timer);
  }, [progress]);

  const getStatusText = () => {
    if (progress === 0) return "Syncing Data";
    if (progress < 30) return "Syncing Data";
    if (progress < 60) return "Optimizing Hub";
    if (progress < 90) return "Media Rendering";
    if (progress < 100) return "Finalizing";
    return "READY";
  };

  return (
    <div className="main-wrapper">
      {/* Outer glow */}
      <div className="outer-glow"></div>

      {/* Progress SVG */}
      <svg className="progress-svg">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00ffff" />
            <stop offset="100%" stopColor="#ff00ff" />
          </linearGradient>
        </defs>
        <circle 
          cx="120" 
          cy="120" 
          r="100" 
          stroke="url(#gradient)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={628}
          strokeDashoffset={offset}
          className="transition-all duration-300 ease-in-out"
        />
      </svg>

      {/* Text ring */}
      <svg className="text-ring" viewBox="0 0 320 320">
        <path 
          id="circlePath" 
          d="M 160, 160 m -130, 0 a 130,130 0 1,1 260,0 a 130,130 0 1,1 -260,0" 
          fill="none" 
        />
        <text>
          <textPath href="#circlePath">
            Easywealth Media Hub • Processing Assets • Easywealth Media Hub •
          </textPath>
        </text>
      </svg>

      {/* Glass core container */}
      <div className="glass-core">
        <div className="percentage-container">
          <h1 id="count" className="text-4xl font-extrabold text-white m-0" style={{letterSpacing: '-2px'}}>
            {currentProgress}%
          </h1>
          <div 
            id="status"
            className={`status-text ${currentProgress >= 100 ? 'text-white' : 'text-cyan-400'}`}
          >
            {getStatusText()}
          </div>
        </div>
      </div>

      {/* Add CSS for animations */}
      <style jsx>{`
        :root {
          --primary-glow: conic-gradient(from 0deg, #ff0000, #ff00ff, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000);
        }
        
        .main-wrapper {
          position: relative;
          width: 350px;
          height: 350px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        /* The Moving RGB Outer Glow */
        .outer-glow {
          position: absolute;
          width: 260px;
          height: 260px;
          border-radius: 50%;
          background: var(--primary-glow);
          animation: rotate 3s linear infinite;
          filter: blur(15px);
          opacity: 0.4;
        }
        
        /* Inner Glass Container */
        .glass-core {
          position: absolute;
          width: 220px;
          height: 220px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 2;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
        }
        
        /* SVG Text Path Styling */
        .text-ring {
          position: absolute;
          width: 320px;
          height: 320px;
          z-index: 3;
          animation: rotate-reverse 12s linear infinite;
        }
        
        .text-ring text {
          fill: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 4.5px;
          text-transform: uppercase;
        }
        
        /* The Progress Circle (Stroke) */
        .progress-svg {
          position: absolute;
          width: 240px;
          height: 240px;
          transform: rotate(-90deg);
          z-index: 4;
        }
        
        .progress-svg circle {
          fill: none;
          stroke-width: 6;
          stroke-linecap: round;
          stroke-dasharray: 628; /* Circumference 2 * PI * 100 */
          stroke-dashoffset: 628;
          transition: stroke-dashoffset 0.3s ease;
          stroke: url(#gradient);
        }
        
        /* Percentage Text */
        .percentage-container {
          text-align: center;
          z-index: 5;
        }
        
        #count {
          font-size: 3rem;
          font-weight: 800;
          color: #fff;
          margin: 0;
          letter-spacing: -2px;
        }
        
        .status-text {
          font-size: 0.7rem;
          color: #00ffcc;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-top: -5px;
          opacity: 0.8;
        }
        
        /* Animations */
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes rotate-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
};

export default AdvancedSpinner;