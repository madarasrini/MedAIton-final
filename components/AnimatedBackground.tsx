
import React, { useEffect, useState } from 'react';

const AnimatedBackground: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Generate floating medical icons with specific movement parameters
  const icons = [
    { id: 1, top: '15%', left: '10%', speed: 0.02, rotation: 'rotate-12' },
    { id: 2, top: '65%', left: '80%', speed: -0.015, rotation: '-rotate-12' },
    { id: 3, top: '30%', left: '75%', speed: 0.01, rotation: 'rotate-45' },
    { id: 4, top: '85%', left: '20%', speed: -0.025, rotation: '-rotate-45' },
    { id: 5, top: '45%', left: '35%', speed: 0.012, rotation: 'rotate-90' },
    { id: 6, top: '10%', left: '85%', speed: 0.008, rotation: '-rotate-6' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-20 transition-opacity duration-1000">
      {icons.map((icon) => (
        <div
          key={icon.id}
          className={`absolute transition-transform duration-700 ease-out ${icon.rotation}`}
          style={{
            top: icon.top,
            left: icon.left,
            transform: `translate(${mousePos.x * icon.speed}px, ${mousePos.y * icon.speed}px)`,
          }}
        >
          <svg 
            width="140" 
            height="140" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className="text-indigo-600/40"
          >
            {/* Heartbeat / Stethoscope Hybrid Look */}
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      ))}
    </div>
  );
};

export default AnimatedBackground;
