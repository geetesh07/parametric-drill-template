
import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  logoPath?: string;
}

export default function Logo({ size = 'md', logoPath = '/logo.svg' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16'
  };
  
  return (
    <Link to="/" className="flex items-center">
      <div className="flex items-center">
        {logoPath ? (
          <img 
            src={logoPath} 
            alt="NTS Tool Solution PRO" 
            className={`${sizeClasses[size]} w-auto`} 
          />
        ) : (
          <div className={`${sizeClasses[size]} flex items-center justify-center bg-primary/10 rounded-md px-3`}>
            <span className="font-bold text-primary">NTS</span>
          </div>
        )}
        <div className="ml-2 flex flex-col">
          <span className="font-bold text-xl leading-tight tracking-tight">NTS</span>
          <span className="text-xs leading-tight text-muted-foreground">Tool Solution PRO v5.6.2</span>
        </div>
      </div>
    </Link>
  );
}
