import React from 'react';
import Image from 'next/image';

/**
 * AfriConnect Exchange Official Logo Component
 * 
 * Brand Identity:
 * - Stylized globe centered on Africa
 * - Interconnected nodes symbolizing digital exchange
 * - Circular arrow with gradient (Green → Blue → Orange)
 * - "AFRICONNECT" in bold black uppercase (Montserrat)
 * - "EXCHANGE" in Diaspora Orange uppercase (Montserrat)
 * 
 * Brand Guidelines:
 * - Minimum size: 100px width
 * - Clear space: 20px minimum padding
 * - Use on white or neutral backgrounds
 * - Do not distort, recolor, or crop
 * - Tagline: "Empowering African Diaspora Connections"
 */

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  showTagline?: boolean;
  priority?: boolean;
}

/**
 * Full-color logo (primary usage)
 * Place your logo JPG file at: /public/images/logo-full-color.jpg
 */
export function Logo({ 
  className = '', 
  width = 200, 
  height = 60,
  showTagline = false,
  priority = false
}: LogoProps) {
  return (
    <div 
      className={`brand-logo inline-flex flex-col items-start ${className}`}
      style={{ padding: '20px', minWidth: '100px' }}
    >
      <div className="relative" style={{ width, height }}>
        <Image
          src="/images/logo-full-color.jpg"
          alt="AfriConnect Exchange - Empowering African Diaspora Connections"
          fill
          style={{ objectFit: 'contain' }}
          priority={priority}
        />
      </div>
      
      {showTagline && (
        <p 
          className="mt-2 text-xs italic text-slate-600" 
          style={{ fontFamily: 'Ubuntu, sans-serif' }}
        >
          Empowering African Diaspora Connections
        </p>
      )}
    </div>
  );
}

/**
 * Compact version for mobile/small spaces
 * Place icon file at: /public/images/logo-icon.jpg
 */
export function LogoCompact({ 
  className = '',
  size = 40,
  priority = false
}: { 
  className?: string; 
  size?: number;
  priority?: boolean;
}) {
  return (
    <div 
      className={`brand-logo inline-flex items-center ${className}`}
      style={{ padding: '10px', minWidth: '40px' }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <Image
          src="/images/logo-icon.jpg"
          alt="AfriConnect Exchange"
          fill
          style={{ objectFit: 'contain' }}
          priority={priority}
        />
      </div>
    </div>
  );
}

/**
 * Monochrome version for dark backgrounds
 * Place files at: /public/images/logo-white.jpg and /public/images/logo-black.jpg
 */
export function LogoMonochrome({ 
  className = '', 
  width = 200, 
  height = 60,
  variant = 'white',
  priority = false
}: LogoProps & { variant?: 'white' | 'black' }) {
  const logoSrc = variant === 'white' 
    ? '/images/logo-white.jpg' 
    : '/images/logo-black.jpg';
  
  return (
    <div 
      className={`brand-logo inline-flex ${className}`}
      style={{ padding: '20px', minWidth: '100px' }}
    >
      <div className="relative" style={{ width, height }}>
        <Image
          src={logoSrc}
          alt="AfriConnect Exchange Logo"
          fill
          style={{ objectFit: 'contain' }}
          priority={priority}
        />
      </div>
    </div>
  );
}

/**
 * Logo with custom text styling (if logo image doesn't include text)
 * This version combines logo icon with branded text
 */
export function LogoWithText({
  className = '',
  iconSize = 50,
  showTagline = false,
  priority = false
}: {
  className?: string;
  iconSize?: number;
  showTagline?: boolean;
  priority?: boolean;
}) {
  return (
    <div className={`brand-logo inline-flex flex-col items-start ${className}`}>
      <div className="flex items-center gap-3">
        {/* Logo Icon */}
        <div className="relative" style={{ width: iconSize, height: iconSize }}>
          <Image
            src="/images/logo-icon.jpg"
            alt="AfriConnect Exchange Icon"
            fill
            style={{ objectFit: 'contain' }}
            priority={priority}
          />
        </div>
        
        {/* Brand Text */}
        <div className="flex flex-col">
          <h1 
            className="text-2xl font-bold tracking-wide"
            style={{ 
              fontFamily: 'Montserrat, Arial, sans-serif',
              color: '#000000',
              letterSpacing: '0.5px'
            }}
          >
            AFRICONNECT
          </h1>
          <p 
            className="text-sm font-bold tracking-wider"
            style={{ 
              fontFamily: 'Montserrat, Arial, sans-serif',
              color: '#F4B400',
              letterSpacing: '1px'
            }}
          >
            EXCHANGE
          </p>
        </div>
      </div>
      
      {showTagline && (
        <p 
          className="mt-2 text-xs italic text-slate-600" 
          style={{ fontFamily: 'Ubuntu, sans-serif' }}
        >
          Empowering African Diaspora Connections
        </p>
      )}
    </div>
  );
}

export default Logo;
