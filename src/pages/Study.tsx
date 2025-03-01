import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import StudyCard from '@/components/StudyCard';
import { Card, Deck, Difficulty } from '@/lib/types';
import NavBar from '@/components/NavBar';
import { toast } from 'sonner';
import { fetchDeck } from '@/lib/deck-service';
import { fetchDueCardsByDeckId, reviewCard } from '@/lib/card-service';

const Study = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [studiedCount, setStudiedCount] = useState(0);

  useEffect(() => {
    const loadDeckAndCards = async () => {
      if (!deckId) {
        toast.error("ID do deck não encontrado");
        navigate('/');
        return;
      }

      setIsLoading(true);
      
      try {
        // Carregar deck
        const fetchedDeck = await fetchDeck(deckId);
        
        if (!fetchedDeck) {
          toast.error("Deck não encontrado");
          navigate('/');
          return;
        }
        
        setDeck(fetchedDeck);
        
        // Carregar cartões devidos do deck
        const dueCards = await fetchDueCardsByDeckId(deckId);
        
        if (dueCards.length === 0) {
          toast.success("Não há cartões para estudar neste momento!");
          setIsCompleted(true);
        } else {
          setCards(dueCards);
        }
      } catch (error) {
        console.error("Erro ao carregar deck e cartões:", error);
        toast.error("Não foi possível carregar o material de estudo");
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadDeckAndCards();
  }, [deckId, navigate]);

  const handleAnswer = async (difficulty: Difficulty) => {
    if (!cards.length || currentCardIndex >= cards.length || !deckId) {
      return;
    }

    setStudiedCount(prev => prev + 1);
    
    const currentCard = cards[currentCardIndex];
    
    try {
      // Atualizar o cartão no Supabase
      await reviewCard(currentCard, difficulty);
      
      // Move to the next card
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
      } else {
        // All cards completed
        setIsCompleted(true);
        toast.success(`Parabéns! Você estudou ${studiedCount + 1} cartões`);
      }
    } catch (error) {
      console.error("Erro ao atualizar o cartão:", error);
      toast.error("Não foi possível salvar seu progresso");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-10 glass-morphism border-b border-border/40">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-semibold">Carregando...</h1>
          </div>
        </header>
        
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground">Carregando seus flashcards...</p>
        </div>
        
        <NavBar />
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-10 glass-morphism border-b border-border/40">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-semibold">Estudo Completo</h1>
          </div>
        </header>
        
        <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-green-100 rounded-full p-6 text-green-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold mb-1">Muito bem!</h2>
          <p className="text-lg text-muted-foreground mb-4">
            {studiedCount > 0 
              ? `Você estudou ${studiedCount} cartões nesta sessão.` 
              : 'Não há cartões devidos neste momento.'}
          </p>
          <p className="mb-6 text-muted-foreground">
            Volte mais tarde para continuar seus estudos.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
            <Link
              to="/"
              className="py-3 px-4 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors text-center"
            >
              Voltar ao Início
            </Link>
            <Link
              to="/stats"
              className="py-3 px-4 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors text-center"
            >
              Ver Estatísticas
            </Link>
          </div>
        </div>
        
        <NavBar />
      </div>
    );
  }

  const currentCard = cards[currentCardIndex];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 glass-morphism border-b border-border/40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold truncate">
              {deck?.name || "Estudo"}
            </h1>
            <div className="text-sm text-muted-foreground">
              {currentCardIndex + 1} / {cards.length}
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex-grow flex flex-col p-4">
        <div className="flex-grow flex items-center justify-center mb-4 py-8">
          {currentCard && (
            <div className="w-full max-w-md min-h-[400px]">
              <StudyCard
                card={currentCard}
                onAnswer={handleAnswer}
              />
            </div>
          )}
        </div>
      </div>
      
      <NavBar />
    </div>
  );
};

export default Study;
