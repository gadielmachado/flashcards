import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface CardFlipProps {
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
  frontClassName?: string;
  backClassName?: string;
  isFlipped?: boolean;
  onFlip?: (isFlipped: boolean) => void;
}

const CardFlip = ({
  front,
  back,
  className,
  frontClassName,
  backClassName,
  isFlipped: controlledIsFlipped,
  onFlip
}: CardFlipProps) => {
  const [internalIsFlipped, setInternalIsFlipped] = useState(false);
  
  const isFlipped = controlledIsFlipped !== undefined ? controlledIsFlipped : internalIsFlipped;
  
  const handleFlip = () => {
    if (onFlip) {
      onFlip(!isFlipped);
    } else {
      setInternalIsFlipped(!internalIsFlipped);
    }
  };

  return (
    <div 
      className={cn(
        "perspective relative w-full h-full cursor-pointer min-h-[300px]",
        className
      )}
      onClick={handleFlip}
    >
      <div className={cn(
        "preserve-3d relative w-full h-full transition-transform duration-500",
        isFlipped ? "rotate-y-180" : "rotate-y-0"
      )}>
        <div className={cn(
          "backface-hidden absolute w-full h-full flashcard-front min-h-[300px]",
          frontClassName
        )}>
          {front}
        </div>
        <div className={cn(
          "backface-hidden absolute w-full h-full flashcard-back min-h-[300px]",
          backClassName
        )}>
          {back}
        </div>
      </div>
    </div>
  );
};

export default CardFlip;
