import React, { useState } from 'react';
import { Card as CardType, Difficulty } from '@/lib/types';
import CardFlip from './ui/card-flip';
import { toast } from 'sonner';
import { AudioButton } from './ui/audio-button';

interface StudyCardProps {
  card: CardType;
  onAnswer: (difficulty: Difficulty) => void;
}

const StudyCard: React.FC<StudyCardProps> = ({ card, onAnswer }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAnswerButtons, setShowAnswerButtons] = useState(false);

  const handleFlip = (flipped: boolean) => {
    setIsFlipped(flipped);
    if (flipped) {
      setShowAnswerButtons(true);
    }
  };

  const handleAnswer = (difficulty: Difficulty) => {
    // Show appropriate toast based on difficulty
    switch(difficulty) {
      case 'again':
        toast("We'll show this card again soon");
        break;
      case 'hard':
        toast("You'll see this card again before long");
        break;
      case 'good':
        toast("Great! You're making progress");
        break;
      case 'easy':
        toast("Perfect! You know this well");
        break;
    }
    
    onAnswer(difficulty);
    
    // Reset for next card
    setTimeout(() => {
      setIsFlipped(false);
      setShowAnswerButtons(false);
    }, 300);
  };

  const renderMedia = (media: { type: 'image' | 'video' | null, url: string } | undefined) => {
    if (!media) return null;

    if (media.type === 'image') {
      return (
        <img 
          src={media.url} 
          alt="Card media" 
          className="max-h-40 max-w-full object-contain mx-auto my-3 rounded"
        />
      );
    }

    if (media.type === 'video') {
      return (
        <video 
          src={media.url} 
          controls 
          className="max-h-40 max-w-full mx-auto my-3 rounded"
        />
      );
    }

    return null;
  };

  const cardFront = (
    <div className="flex flex-col justify-between h-full p-6">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4 text-center">
        TAP TO REVEAL ANSWER
      </div>
      <div className="flex-grow flex flex-col items-center justify-center min-h-[150px] py-8">
        {card.frontMedia && renderMedia(card.frontMedia)}
        <div className="flex items-center gap-2 text-xl font-medium text-center">
          {card.front}
          <AudioButton text={card.front} size="sm" className="ml-2" />
        </div>
      </div>
      <div className="text-xs text-center text-muted-foreground mt-4">
        {isFlipped ? 'Tap to hide answer' : 'Tap to show answer'}
      </div>
    </div>
  );

  const cardBack = (
    <div className="flex flex-col justify-between h-full p-6">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4 text-center">
        ANSWER
      </div>
      <div className="flex-grow flex flex-col items-center justify-center min-h-[150px] py-8">
        {card.backMedia && renderMedia(card.backMedia)}
        <div className="flex items-center gap-2 text-xl font-medium text-center">
          {card.back}
          <AudioButton text={card.back} size="sm" className="ml-2" />
        </div>
      </div>
      <div className="text-xs text-center text-muted-foreground mt-4">
        How well did you know this?
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow min-h-[300px]">
        <CardFlip
          front={cardFront}
          back={cardBack}
          isFlipped={isFlipped}
          onFlip={handleFlip}
          className="h-full"
          frontClassName="bg-white rounded-xl shadow-md border border-border"
          backClassName="bg-white rounded-xl shadow-md border border-border"
        />
      </div>
      
      {showAnswerButtons && (
        <div className="grid grid-cols-4 gap-2 mt-4 animate-fade-in">
          <button
            onClick={() => handleAnswer('again')}
            className="py-3 px-4 rounded-lg bg-destructive/10 text-destructive font-medium hover:bg-destructive/20 transition-colors"
          >
            Again
          </button>
          <button
            onClick={() => handleAnswer('hard')}
            className="py-3 px-4 rounded-lg bg-orange-500/10 text-orange-600 font-medium hover:bg-orange-500/20 transition-colors"
          >
            Hard
          </button>
          <button
            onClick={() => handleAnswer('good')}
            className="py-3 px-4 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
          >
            Good
          </button>
          <button
            onClick={() => handleAnswer('easy')}
            className="py-3 px-4 rounded-lg bg-green-500/10 text-green-600 font-medium hover:bg-green-500/20 transition-colors"
          >
            Easy
          </button>
        </div>
      )}
    </div>
  );
};

export default StudyCard;
