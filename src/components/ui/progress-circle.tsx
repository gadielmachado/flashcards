
import { cn } from '@/lib/utils';
import React from 'react';

interface ProgressCircleProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  showPercentage?: boolean;
  animateOnMount?: boolean;
}

const ProgressCircle = ({
  progress,
  size = 36,
  strokeWidth = 3,
  className,
  showPercentage = false,
  animateOnMount = true
}: ProgressCircleProps) => {
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        height={size}
        width={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          r={radius}
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeOpacity={0.2}
        />
        
        {/* Progress circle */}
        <circle
          r={radius}
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animateOnMount ? strokeDashoffset : 0}
          className={animateOnMount ? "animate-progress-fill" : ""}
          style={!animateOnMount ? { strokeDashoffset } : {}}
        />
      </svg>
      
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
          {Math.round(normalizedProgress)}%
        </div>
      )}
    </div>
  );
};

export default ProgressCircle;
