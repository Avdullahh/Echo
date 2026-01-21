import React from 'react';
import { RiskLevel } from '../types';

interface TrafficLightProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
}

export const TrafficLight: React.FC<TrafficLightProps> = ({ level, size = 'md' }) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-3 h-3';
      case 'lg': return 'w-8 h-8';
      default: return 'w-5 h-5';
    }
  };

  const getColorClasses = () => {
    switch (level) {
      case RiskLevel.SAFE:
        return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]';
      case RiskLevel.WARNING:
        return 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]';
      case RiskLevel.CRITICAL:
        return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]';
    }
  };

  return (
    <div className={`rounded-full transition-all duration-300 ${getSizeClasses()} ${getColorClasses()}`} />
  );
};