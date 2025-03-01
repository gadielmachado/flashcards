import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DeckList from '@/components/DeckList';
import { Deck } from '@/lib/types';
import NavBar from '@/components/NavBar';
import { fetchDecks, deleteDeck } from '@/lib/deck-service';
import { toast } from 'sonner';
import { checkSupabaseConnection } from '@/lib/supabase';

// Sample data for demonstration when no decks exist yet
const sampleDecks: Deck[] = [
  {
    id: '1',
    name: 'Basic English Vocabulary',
    description: 'Common everyday words and phrases for beginners',
    totalCards: 50,
    dueCards: 12,
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
  },
  {
    id: '2',
    name: 'Business English',
    description: 'Professional vocabulary for meetings, emails, and presentations',
    totalCards: 30,
    dueCards: 5,
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
  },
  {
    id: '3',
    name: 'English Idioms',
    description: 'Common expressions that have a figurative meaning',
    totalCards: 25,
    dueCards: 0,
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
  },
];

const Index = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const testConnection = async () => {
      const isConnected = await checkSupabaseConnection();
      setIsOnline(isConnected);
      if (!isConnected) {
        toast.error('Modo offline ativado. Os dados serão salvos localmente.');
      }
    };
    
    testConnection();
  }, []);

  useEffect(() => {
    const loadDecks = async () => {
      setIsLoading(true);
      try {
        const fetchedDecks = await fetchDecks();
        
        if (fetchedDecks.length === 0) {
          // Use sample decks if no decks exist
          setDecks(sampleDecks);
        } else {
          setDecks(fetchedDecks);
        }
      } catch (error) {
        console.error('Erro ao carregar decks:', error);
        toast.error('Não foi possível carregar os decks');
      } finally {
        setIsLoading(false);
      }
    };

    loadDecks();
  }, []);

  const handleDeleteDeck = async (deckId: string) => {
    try {
      await deleteDeck(deckId);
      setDecks(decks.filter(deck => deck.id !== deckId));
    } catch (error) {
      console.error('Erro ao excluir deck:', error);
      toast.error('Não foi possível excluir o deck');
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-10 glass-morphism border-b border-border/40 mb-6">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-semibold">Meus Decks</h1>
          {!isOnline && (
            <div className="text-sm text-amber-500 font-medium mt-1">
              Modo offline - Os dados estão sendo salvos localmente
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <p className="mt-4 text-muted-foreground">Carregando seus decks...</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <Link 
                to="/create" 
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
              >
                Criar Novo Deck
              </Link>
            </div>
            <DeckList decks={decks} onDeleteDeck={handleDeleteDeck} />
          </>
        )}
      </main>

      <NavBar />
    </div>
  );
};

export default Index;
