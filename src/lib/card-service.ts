import { Card, Difficulty } from './types';
import { supabase, SupabaseCard, handleSupabaseError } from './supabase';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { processCardReview, isCardDue } from './spaced-repetition';

// Converter de formato Supabase para nosso formato
const mapSupabaseCardToCard = (supabaseCard: SupabaseCard): Card => {
  return {
    id: supabaseCard.id,
    front: supabaseCard.front,
    back: supabaseCard.back,
    deckId: supabaseCard.deck_id,
    createdAt: new Date(supabaseCard.created_at).getTime(),
    lastReviewed: supabaseCard.last_reviewed 
      ? new Date(supabaseCard.last_reviewed).getTime() 
      : undefined,
    nextReview: supabaseCard.next_review 
      ? new Date(supabaseCard.next_review).getTime() 
      : undefined,
    interval: supabaseCard.interval,
    easeFactor: supabaseCard.ease_factor,
    repetitions: supabaseCard.repetitions,
    frontMedia: supabaseCard.front_media,
    backMedia: supabaseCard.back_media,
  };
};

// Converter do nosso formato para o formato Supabase
const mapCardToSupabaseCard = (card: Card): SupabaseCard => {
  return {
    id: card.id,
    front: card.front,
    back: card.back,
    deck_id: card.deckId,
    created_at: new Date(card.createdAt).toISOString(),
    last_reviewed: card.lastReviewed 
      ? new Date(card.lastReviewed).toISOString() 
      : undefined,
    next_review: card.nextReview 
      ? new Date(card.nextReview).toISOString() 
      : undefined,
    interval: card.interval,
    ease_factor: card.easeFactor,
    repetitions: card.repetitions,
    front_media: card.frontMedia,
    back_media: card.backMedia,
  };
};

// Buscar todos os cartões de um deck
export const fetchCardsByDeckId = async (deckId: string): Promise<Card[]> => {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('deck_id', deckId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!data) return [];

    return data.map(mapSupabaseCardToCard);
  } catch (error) {
    handleSupabaseError(error as Error);
    
    // Fallback para localStorage se o Supabase falhar
    const localCards = localStorage.getItem(`flashcards-cards-${deckId}`);
    if (localCards) {
      return JSON.parse(localCards);
    }
    
    return [];
  }
};

// Buscar cartões devidos de um deck
export const fetchDueCardsByDeckId = async (deckId: string): Promise<Card[]> => {
  try {
    const cards = await fetchCardsByDeckId(deckId);
    return cards.filter(isCardDue);
  } catch (error) {
    handleSupabaseError(error as Error);
    return [];
  }
};

// Criar um novo cartão
export const createCard = async (card: Omit<Card, 'id'>): Promise<Card> => {
  const newCard: Card = {
    ...card,
    id: uuidv4(),
  };

  try {
    const supabaseCard = mapCardToSupabaseCard(newCard);
    
    const { error } = await supabase
      .from('cards')
      .insert(supabaseCard);

    if (error) throw error;

    // Atualizar o contador de cartões no deck
    await updateDeckCardCount(card.deckId);

    return newCard;
  } catch (error) {
    handleSupabaseError(error as Error);
    
    // Fallback: salvar em localStorage
    try {
      const existingCards = localStorage.getItem(`flashcards-cards-${card.deckId}`);
      const cards = existingCards ? JSON.parse(existingCards) : [];
      cards.push(newCard);
      localStorage.setItem(`flashcards-cards-${card.deckId}`, JSON.stringify(cards));
      
      // Atualizar o contador de cartões no deck local
      const localDecks = localStorage.getItem('flashcards-decks');
      if (localDecks) {
        const decks = JSON.parse(localDecks);
        const updatedDecks = decks.map((d: any) => {
          if (d.id === card.deckId) {
            return { ...d, totalCards: d.totalCards + 1, dueCards: d.dueCards + 1 };
          }
          return d;
        });
        localStorage.setItem('flashcards-decks', JSON.stringify(updatedDecks));
      }
      
      return newCard;
    } catch (localError) {
      toast.error('Não foi possível salvar o cartão');
      throw localError;
    }
  }
};

// Atualizar um cartão existente
export const updateCard = async (card: Card): Promise<Card> => {
  try {
    const supabaseCard = mapCardToSupabaseCard(card);
    
    const { error } = await supabase
      .from('cards')
      .update(supabaseCard)
      .eq('id', card.id);

    if (error) throw error;

    return card;
  } catch (error) {
    handleSupabaseError(error as Error);
    
    // Fallback: atualizar em localStorage
    try {
      const existingCards = localStorage.getItem(`flashcards-cards-${card.deckId}`);
      if (existingCards) {
        const cards = JSON.parse(existingCards);
        const updatedCards = cards.map((c: Card) => 
          c.id === card.id ? card : c
        );
        localStorage.setItem(`flashcards-cards-${card.deckId}`, JSON.stringify(updatedCards));
      }
      return card;
    } catch (localError) {
      toast.error('Não foi possível atualizar o cartão');
      throw localError;
    }
  }
};

// Revisar um cartão (processar a resposta do usuário)
export const reviewCard = async (card: Card, difficulty: Difficulty): Promise<Card> => {
  const updatedCard = processCardReview(card, difficulty);
  return await updateCard(updatedCard);
};

// Deletar um cartão
export const deleteCard = async (card: Card): Promise<void> => {
  try {
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', card.id);

    if (error) throw error;

    // Atualizar o contador de cartões no deck
    await updateDeckCardCount(card.deckId);
  } catch (error) {
    handleSupabaseError(error as Error);
    
    // Fallback: deletar de localStorage
    try {
      const existingCards = localStorage.getItem(`flashcards-cards-${card.deckId}`);
      if (existingCards) {
        const cards = JSON.parse(existingCards);
        const filteredCards = cards.filter((c: Card) => c.id !== card.id);
        localStorage.setItem(`flashcards-cards-${card.deckId}`, JSON.stringify(filteredCards));
        
        // Atualizar o contador de cartões no deck local
        const localDecks = localStorage.getItem('flashcards-decks');
        if (localDecks) {
          const decks = JSON.parse(localDecks);
          const updatedDecks = decks.map((d: any) => {
            if (d.id === card.deckId) {
              const isDue = isCardDue(card);
              return { 
                ...d, 
                totalCards: Math.max(0, d.totalCards - 1), 
                dueCards: isDue ? Math.max(0, d.dueCards - 1) : d.dueCards 
              };
            }
            return d;
          });
          localStorage.setItem('flashcards-decks', JSON.stringify(updatedDecks));
        }
      }
    } catch (localError) {
      toast.error('Não foi possível excluir o cartão');
      throw localError;
    }
  }
};

// Atualizar o contador de cartões em um deck
async function updateDeckCardCount(deckId: string): Promise<void> {
  try {
    // Obter todos os cartões do deck
    const cards = await fetchCardsByDeckId(deckId);
    
    // Calcular quantos estão devidos
    const dueCards = cards.filter(isCardDue).length;
    
    // Atualizar o deck
    const { error } = await supabase
      .from('decks')
      .update({ 
        total_cards: cards.length,
        due_cards: dueCards
      })
      .eq('id', deckId);

    if (error) throw error;
  } catch (error) {
    handleSupabaseError(error as Error);
  }
}; 