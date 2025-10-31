
import React from 'react';

interface SplashScreenProps {
  isFinishing: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isFinishing }) => {
  return (
    <div className={`fixed inset-0 bg-ivory z-[100] flex items-center justify-center transition-opacity duration-500 ease-in-out ${isFinishing ? 'opacity-0' : 'opacity-100'}`}>
      <div className="splash-logo">
        <svg width="250" height="100" viewBox="0 0 250 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <text x="50%" y="50%" 
              fontFamily="Tajawal, sans-serif" 
              fontSize="60" 
              fontWeight="bold"
              fill="#0B2545" 
              textAnchor="middle" 
              dominantBaseline="central">
                حِرَفي
            </text>
        </svg>
      </div>
    </div>
  );
};
