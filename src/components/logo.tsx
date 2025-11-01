import React from 'react';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  showTagline?: boolean;
}

/**
 * AfriConnect Exchange Official Logo Component
 * 
 * Features:
 * - Stylized globe centered on Africa
 * - Interconnected nodes symbolizing digital exchange
 * - Circular arrow with gradient (Green → Blue → Orange)
 * - "AFRICONNECT" in bold black uppercase
 * - "EXCHANGE" in smaller orange uppercase
 * - Traditional African patterns within the globe
 * 
 * Brand Guidelines:
 * - Minimum size: 100px width
 * - Clear space: 20px minimum padding
 * - Use on white or neutral backgrounds
 * - Do not distort, recolor, or crop
 */
export function Logo({ 
  className = '', 
  width = 200, 
  height = 60,
  showTagline = false,
  withText = true
}: LogoProps & { withText?: boolean }) {
  return (
    <div className={`brand-logo inline-flex flex-col items-start ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 200 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="AfriConnect Exchange Logo"
      >
        <defs>
          {/* Gradient for the circular arrow */}
          <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#34A853', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#0072CE', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#F4B400', stopOpacity: 1 }} />
          </linearGradient>
          
          {/* Pattern for African textile motif */}
          <pattern id="africanPattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M0 4h8M4 0v8" stroke="#2C2A4A" strokeWidth="0.5" opacity="0.2" />
          </pattern>
        </defs>

        {/* Globe with Africa centered */}
        <g id="globe">
          {/* Outer circle */}
          <circle cx="30" cy="30" r="24" fill="url(#africanPattern)" stroke="#2C2A4A" strokeWidth="1.5" />
          
          {/* Simplified Africa shape */}
          <path
            d="M25 15 L28 18 L30 16 L32 18 L35 15 L37 20 L35 25 L36 30 L34 35 L32 38 L30 40 L28 38 L26 35 L24 32 L23 28 L24 24 L23 20 Z"
            fill="#2C2A4A"
            opacity="0.8"
          />
          
          {/* Connection nodes */}
          <circle cx="30" cy="30" r="2" fill="#0072CE" />
          <circle cx="25" cy="22" r="1.5" fill="#F4B400" />
          <circle cx="35" cy="22" r="1.5" fill="#34A853" />
          <circle cx="27" cy="35" r="1.5" fill="#34A853" />
          <circle cx="33" cy="35" r="1.5" fill="#F4B400" />
          
          {/* Connection lines */}
          <line x1="30" y1="30" x2="25" y2="22" stroke="#0072CE" strokeWidth="0.8" opacity="0.6" />
          <line x1="30" y1="30" x2="35" y2="22" stroke="#0072CE" strokeWidth="0.8" opacity="0.6" />
          <line x1="30" y1="30" x2="27" y2="35" stroke="#0072CE" strokeWidth="0.8" opacity="0.6" />
          <line x1="30" y1="30" x2="33" y2="35" stroke="#0072CE" strokeWidth="0.8" opacity="0.6" />
        </g>

        {/* Circular arrow representing movement and progress */}
        <g id="circularArrow">
          <path
            d="M 50 15 A 20 20 0 1 1 50 45"
            stroke="url(#arrowGradient)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          {/* Arrow head */}
          <polygon
            points="48,45 52,45 50,48"
            fill="#F4B400"
          />
        </g>

        {withText && (
          <>
            {/* Text: AFRICONNECT */}
            <text
              x="75"
              y="32"
              fontFamily="Montserrat, Arial, sans-serif"
              fontSize="18"
              fontWeight="700"
              fill="#000000"
              letterSpacing="0.5"
            >
              AFRICONNECT
            </text>

            {/* Text: EXCHANGE */}
            <text
              x="75"
              y="48"
              fontFamily="Montserrat, Arial, sans-serif"
              fontSize="12"
              fontWeight="700"
              fill="#F4B400"
              letterSpacing="1"
            >
              EXCHANGE
            </text>
          </>
        )}
      </svg>
      
      {showTagline && (
        <p className="mt-1 text-xs font-ubuntu italic text-slate-600" style={{ fontFamily: 'Ubuntu, sans-serif' }}>
          Empowering African Diaspora Connections
        </p>
      )}
    </div>
  );
}

/**
 * Compact version for mobile/small spaces
 */
export function LogoCompact({ className = '' }: { className?: string }) {
  return (
    <div className={`brand-logo inline-flex items-center ${className}`}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="AfriConnect Exchange"
      >
        <defs>
          <linearGradient id="compactArrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#34A853', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#0072CE', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#F4B400', stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* Simplified globe */}
        <circle cx="30" cy="30" r="24" fill="#2C2A4A" opacity="0.1" stroke="#2C2A4A" strokeWidth="2" />
        
        {/* Africa shape */}
        <path
          d="M25 15 L28 18 L30 16 L32 18 L35 15 L37 20 L35 25 L36 30 L34 35 L32 38 L30 40 L28 38 L26 35 L24 32 L23 28 L24 24 L23 20 Z"
          fill="#2C2A4A"
        />
        
        {/* Circular arrow */}
        <path
          d="M 48 15 A 20 20 0 1 1 48 45"
          stroke="url(#compactArrowGradient)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <polygon points="46,45 50,45 48,48" fill="#F4B400" />
      </svg>
    </div>
  );
}

/**
 * Monochrome version for dark backgrounds
 */
export function LogoMonochrome({ 
  className = '', 
  width = 200, 
  height = 60,
  variant = 'white',
  withText = true
}: LogoProps & { variant?: 'white' | 'black'; withText?: boolean }) {
  const color = variant === 'white' ? '#FFFFFF' : '#000000';
  
  return (
    <div className={`brand-logo inline-flex ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 200 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="AfriConnect Exchange Logo"
      >
        {/* Globe */}
        <circle cx="30" cy="30" r="24" fill="none" stroke={color} strokeWidth="1.5" />
        <path
          d="M25 15 L28 18 L30 16 L32 18 L35 15 L37 20 L35 25 L36 30 L34 35 L32 38 L30 40 L28 38 L26 35 L24 32 L23 28 L24 24 L23 20 Z"
          fill={color}
          opacity="0.8"
        />
        
        {/* Circular arrow */}
        <path
          d="M 50 15 A 20 20 0 1 1 50 45"
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <polygon points="48,45 52,45 50,48" fill={color} />

        {withText && (
          <>
            {/* Text */}
            <text
              x="75"
              y="32"
              fontFamily="Montserrat, Arial, sans-serif"
              fontSize="18"
              fontWeight="700"
              fill={color}
              letterSpacing="0.5"
            >
              AFRICONNECT
            </text>
            <text
              x="75"
              y="48"
              fontFamily="Montserrat, Arial, sans-serif"
              fontSize="12"
              fontWeight="700"
              fill={color}
              letterSpacing="1"
            >
              EXCHANGE
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

export default Logo;
