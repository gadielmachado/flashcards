
import { Card, Difficulty } from './types';

const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;

export const processCardReview = (card: Card, difficulty: Difficulty): Card => {
  // Initialize card learning parameters if they don't exist
  const easeFactor = card.easeFactor || DEFAULT_EASE_FACTOR;
  const repetitions = card.repetitions || 0;
  const interval = card.interval || 0;
  const now = Date.now();

  let newEaseFactor = easeFactor;
  let newRepetitions = repetitions;
  let newInterval = interval;

  // Process based on difficulty rating
  switch (difficulty) {
    case 'again':
      // Reset repetitions for incorrect answers
      newRepetitions = 0;
      newInterval = 1; // 1 day
      newEaseFactor = Math.max(easeFactor - 0.2, MIN_EASE_FACTOR);
      break;
    
    case 'hard':
      if (interval === 0) {
        newInterval = 1; // First time: 1 day
      } else {
        newInterval = Math.round(interval * 1.2);
      }
      newEaseFactor = Math.max(easeFactor - 0.15, MIN_EASE_FACTOR);
      newRepetitions = repetitions + 1;
      break;
    
    case 'good':
      if (repetitions === 0) {
        newInterval = 1; // First time: 1 day
      } else if (repetitions === 1) {
        newInterval = 3; // Second time: 3 days
      } else {
        newInterval = Math.round(interval * easeFactor);
      }
      newRepetitions = repetitions + 1;
      break;
    
    case 'easy':
      if (repetitions === 0) {
        newInterval = 4; // First time: 4 days
      } else {
        newInterval = Math.round(interval * easeFactor * 1.3);
      }
      newEaseFactor = easeFactor + 0.15;
      newRepetitions = repetitions + 1;
      break;
  }

  // Calculate next review date (in milliseconds)
  const nextReview = now + (newInterval * 24 * 60 * 60 * 1000);

  return {
    ...card,
    lastReviewed: now,
    nextReview,
    interval: newInterval,
    easeFactor: newEaseFactor,
    repetitions: newRepetitions
  };
};

// Check if a card is due for review
export const isCardDue = (card: Card): boolean => {
  const now = Date.now();
  return !card.nextReview || card.nextReview <= now;
};

// Get due cards from a deck
export const getDueCards = (cards: Card[]): Card[] => {
  return cards.filter(isCardDue);
};
