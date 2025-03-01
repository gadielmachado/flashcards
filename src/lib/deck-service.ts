import { Deck } from './types';
import { supabase, SupabaseDeck, handleSupabaseError } from './supabase';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// Converter de formato Supabase para nosso formato
const mapSupabaseDeckToDeck = (supabaseDeck: SupabaseDeck): Deck => {
  return {
    id: supabaseDeck.id,
    name: supabaseDeck.name,
    description: supabaseDeck.description,
    totalCards: supabaseDeck.total_cards,
    dueCards: supabaseDeck.due_cards,
    createdAt: new Date(supabaseDeck.created_at).getTime(),
  };
};

// Converter do nosso formato para o formato Supabase
const mapDeckToSupabaseDeck = (deck: Deck): SupabaseDeck => {
  return {
    id: deck.id,
    name: deck.name,
    description: deck.description,
    total_cards: deck.totalCards,
    due_cards: deck.dueCards,
    created_at: new Date(deck.createdAt).toISOString(),
  };
};

// Buscar todos os decks
export const fetchDecks = async (): Promise<Deck[]> => {
  try {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Verificar se o erro é de tabela inexistente
      if (error.message && error.message.includes('relation "decks" does not exist')) {
        throw new Error('Tabela de decks não existe. Banco de dados não configurado.');
      }
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('Nenhum deck encontrado no Supabase');
      
      // Verificar no localStorage
      const localDecks = localStorage.getItem('flashcards-decks');
      if (localDecks) {
        console.log('Decks encontrados no localStorage');
        return JSON.parse(localDecks);
      }
      
      return [];
    }

    console.log(`${data.length} decks encontrados no Supabase`);
    return data.map(mapSupabaseDeckToDeck);
  } catch (error) {
    console.error('Erro ao buscar decks:', error);
    handleSupabaseError(error as Error);
    
    // Fallback para localStorage se o Supabase falhar
    const localDecks = localStorage.getItem('flashcards-decks');
    if (localDecks) {
      console.log('Usando decks do localStorage como fallback');
      return JSON.parse(localDecks);
    }
    
    console.log('Nenhum deck encontrado localmente');
    return [];
  }
};

// Buscar um deck específico
export const fetchDeck = async (deckId: string): Promise<Deck | null> => {
  try {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('id', deckId)
      .single();

    if (error) throw error;
    
    if (!data) return null;

    return mapSupabaseDeckToDeck(data);
  } catch (error) {
    handleSupabaseError(error as Error);
    return null;
  }
};

// Criar um novo deck
export const createDeck = async (deck: Omit<Deck, 'id'>): Promise<Deck> => {
  const newDeck: Deck = {
    ...deck,
    id: uuidv4(),
  };

  try {
    const supabaseDeck = mapDeckToSupabaseDeck(newDeck);
    
    const { error } = await supabase
      .from('decks')
      .insert(supabaseDeck);

    if (error) throw error;

    toast.success('Deck criado com sucesso!');
    return newDeck;
  } catch (error) {
    handleSupabaseError(error as Error);
    
    // Fallback: salvar em localStorage
    try {
      const existingDecks = localStorage.getItem('flashcards-decks');
      const decks = existingDecks ? JSON.parse(existingDecks) : [];
      decks.push(newDeck);
      localStorage.setItem('flashcards-decks', JSON.stringify(decks));
      toast.success('Deck salvo localmente (offline)');
      return newDeck;
    } catch (localError) {
      toast.error('Não foi possível salvar o deck');
      throw localError;
    }
  }
};

// Atualizar um deck existente
export const updateDeck = async (deck: Deck): Promise<Deck> => {
  try {
    const supabaseDeck = mapDeckToSupabaseDeck(deck);
    
    const { error } = await supabase
      .from('decks')
      .update(supabaseDeck)
      .eq('id', deck.id);

    if (error) throw error;

    toast.success('Deck atualizado com sucesso!');
    return deck;
  } catch (error) {
    handleSupabaseError(error as Error);
    
    // Fallback: atualizar em localStorage
    try {
      const existingDecks = localStorage.getItem('flashcards-decks');
      if (existingDecks) {
        const decks = JSON.parse(existingDecks);
        const updatedDecks = decks.map((d: Deck) => 
          d.id === deck.id ? deck : d
        );
        localStorage.setItem('flashcards-decks', JSON.stringify(updatedDecks));
        toast.success('Deck atualizado localmente (offline)');
      }
      return deck;
    } catch (localError) {
      toast.error('Não foi possível atualizar o deck');
      throw localError;
    }
  }
};

// Deletar um deck
export const deleteDeck = async (deckId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('decks')
      .delete()
      .eq('id', deckId);

    if (error) throw error;

    toast.success('Deck excluído com sucesso!');
  } catch (error) {
    handleSupabaseError(error as Error);
    
    // Fallback: deletar de localStorage
    try {
      const existingDecks = localStorage.getItem('flashcards-decks');
      if (existingDecks) {
        const decks = JSON.parse(existingDecks);
        const filteredDecks = decks.filter((d: Deck) => d.id !== deckId);
        localStorage.setItem('flashcards-decks', JSON.stringify(filteredDecks));
        toast.success('Deck excluído localmente (offline)');
      }
    } catch (localError) {
      toast.error('Não foi possível excluir o deck');
      throw localError;
    }
  }
}; 