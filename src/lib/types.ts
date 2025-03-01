
export type Difficulty = 'again' | 'hard' | 'good' | 'easy';

export type MediaType = 'image' | 'video' | null;

export interface Card {
  id: string;
  front: string;
  back: string;
  deckId: string;
  createdAt: number;
  lastReviewed?: number;
  nextReview?: number;
  interval?: number;
  easeFactor?: number;
  repetitions?: number;
  frontMedia?: {
    type: MediaType;
    url: string;
  };
  backMedia?: {
    type: MediaType;
    url: string;
  };
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  totalCards: number;
  dueCards: number;
  createdAt: number;
}

export interface StudySession {
  deckId: string;
  cardsStudied: number;
  correctAnswers: number;
  startTime: number;
  endTime?: number;
}
