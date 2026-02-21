import React from 'react';

interface SleekGaugeProps {
  value: number;
  max?: number;
  label: string;
  colorStart?: string;
  colorEnd?: string;
}

export function SleekGauge({ 
  value, 
  max = 100, 
  label, 
  colorStart = '#ec4899', // pink-500
  colorEnd = '#3b82f6'  // blue-500
}: SleekGaugeProps) {
  const radius = 40;
  const stroke = 8;
  const normalizedValue = Math.min(Math.max(value, 0), max);
  const circumference = normalizedValue / max * (Math.PI * radius); // Half circle arc length
  
  // We'll do a 180 degree gauge for "sleekness"
  const fullCircumference = Math.PI * radius;
  const strokeDashoffset = fullCircumference - (normalizedValue / max) * fullCircumference;

  return (
    <div className="flex flex-col items-center justify-center relative">
      <svg width="120" height="70" viewBox="0 0 120 70" className="overflow-visible">
        <defs>
          <linearGradient id={`grad-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorStart} />
            <stop offset="100%" stopColor={colorEnd} />
          </linearGradient>
          <filter id={`glow-${label}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Background Track */}
        <path
          d="M 20 60 A 40 40 0 0 1 100 60"
          fill="none"
          stroke="#27272a" // zinc-800
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        
        {/* Value Arc */}
        <path
          d="M 20 60 A 40 40 0 0 1 100 60"
          fill="none"
          stroke={`url(#grad-${label})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={fullCircumference}
          strokeDashoffset={strokeDashoffset}
          filter={`url(#glow-${label})`}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      
      <div className="absolute bottom-0 flex flex-col items-center">
        <span className="text-2xl font-bold text-white font-mono tracking-tighter">
          {value.toFixed(1)}%
        </span>
        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider mt-1">
          {label}
        </span>
      </div>
    </div>
  );
}
