import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CreateCard from '@/components/CreateCard';
import { Card, Deck } from '@/lib/types';
import NavBar from '@/components/NavBar';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { createDeck, fetchDecks } from '@/lib/deck-service';
import { createCard } from '@/lib/card-service';

const Create = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [createOption, setCreateOption] = useState<'deck' | 'card'>('deck');
  const [step, setStep] = useState<'deck' | 'cards'>('deck');
  const [deck, setDeck] = useState<Omit<Deck, 'id' | 'totalCards' | 'dueCards'>>({
    name: '',
    description: '',
    createdAt: Date.now(),
  });
  const [cards, setCards] = useState<Omit<Card, 'id'>[]>([]);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [existingDecks, setExistingDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [singleCard, setSingleCard] = useState<Omit<Card, 'id' | 'deckId'>>({
    front: '',
    back: '',
    createdAt: Date.now(),
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    nextReview: Date.now(),
  });

  useEffect(() => {
    const loadExistingDecks = async () => {
      try {
        console.log('Tentando carregar decks...');
        const decks = await fetchDecks();
        console.log('Decks carregados:', decks);
        
        if (decks && decks.length > 0) {
          setExistingDecks(decks);
          setSelectedDeckId(decks[0].id);
          console.log('Decks existentes carregados com sucesso:', decks.length);
        } else {
          console.log('Nenhum deck retornado da API');
          // Verificar localStorage como fallback
          try {
            const localDecks = localStorage.getItem('flashcards-decks');
            if (localDecks) {
              const parsedDecks = JSON.parse(localDecks);
              if (parsedDecks && parsedDecks.length > 0) {
                console.log('Usando decks do localStorage:', parsedDecks.length);
                setExistingDecks(parsedDecks);
                setSelectedDeckId(parsedDecks[0].id);
              } else {
                console.log('Nenhum deck no localStorage ou array vazio');
              }
            } else {
              console.log('Nenhum deck no localStorage');
            }
          } catch (localError) {
            console.error('Erro ao ler decks do localStorage:', localError);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar decks:', error);
        toast.error('Erro ao carregar decks. Verificando opções de fallback...');
        
        // Tentar usar localStorage como fallback
        try {
          const localDecks = localStorage.getItem('flashcards-decks');
          if (localDecks) {
            const parsedDecks = JSON.parse(localDecks);
            if (parsedDecks && parsedDecks.length > 0) {
              console.log('Usando decks do localStorage como fallback:', parsedDecks.length);
              setExistingDecks(parsedDecks);
              setSelectedDeckId(parsedDecks[0].id);
            }
          } else {
            console.log('Sem decks no localStorage para fallback');
            toast.error('Não foi possível carregar os decks. Crie um novo deck.');
          }
        } catch (localError) {
          console.error('Erro ao ler decks do localStorage:', localError);
          toast.error('Não foi possível carregar nenhum deck');
        }
      }
    };

    if (createOption === 'card') {
      loadExistingDecks();
    }
  }, [createOption]);

  const handleCreateSingleCard = async () => {
    if (!selectedDeckId) {
      toast.error('Por favor, selecione um deck para adicionar o card');
      return;
    }

    if (!singleCard.front.trim() || !singleCard.back.trim()) {
      toast.error('Por favor, preencha o frente e o verso do cartão');
      return;
    }

    setIsCreating(true);

    try {
      const deckExists = existingDecks.some(deck => deck.id === selectedDeckId);
      
      if (!deckExists) {
        toast.error('O deck selecionado não existe mais. Por favor, selecione outro deck.');
        setIsCreating(false);
        return;
      }
      
      const newCard = await createCard({
        ...singleCard,
        deckId: selectedDeckId,
      });

      toast.success('Card criado com sucesso!');
      
      setSingleCard({
        front: '',
        back: '',
        createdAt: Date.now(),
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        nextReview: Date.now(),
      });
      
    } catch (error) {
      console.error('Erro ao criar card:', error);
      toast.error('Não foi possível criar o card');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deck.name.trim()) {
      toast.error("Por favor, digite um nome para o deck");
      return;
    }
    
    setStep('cards');
  };

  const handleSaveCard = (card: Omit<Card, 'id'>) => {
    setCards([...cards, card]);
    setShowCreateCard(false);
    toast.success("Cartão adicionado com sucesso");
  };

  const handleFinish = async () => {
    if (cards.length === 0) {
      toast.error("Por favor, adicione pelo menos um cartão ao seu deck");
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Criar o deck no Supabase
      const newDeck = await createDeck({
        ...deck,
        totalCards: cards.length,
        dueCards: cards.length,
      });
      
      // Adicionar todos os cartões ao Supabase
      const cardPromises = cards.map(card => 
        createCard({ ...card, deckId: newDeck.id })
      );
      
      await Promise.all(cardPromises);
      
      toast.success("Deck criado com sucesso!");
      navigate('/');
    } catch (error) {
      console.error('Erro ao criar deck:', error);
      toast.error("Não foi possível criar o deck. Verifique sua conexão.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.apkg')) {
      toast.error('Please select a valid Anki package file (.apkg)');
      return;
    }

    setIsImporting(true);
    const loadingToast = toast.loading('Importing Anki deck...');

    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      
      const extractedCards: Omit<Card, 'id'>[] = [];
      
      let deckName = file.name.replace('.apkg', '');
      
      const collectionFile = zipContent.file('collection.anki2');
      
      if (collectionFile) {
        if (deck.name === '') {
          setDeck({
            ...deck,
            name: deckName,
            description: deck.description || `Imported from ${file.name}`
          });
        }
        
        for (const filename in zipContent.files) {
          if (filename.endsWith('.txt') || filename.endsWith('.html')) {
            const content = await zipContent.file(filename)?.async('string');
            if (content) {
              const lines = content.split('\n').filter(line => line.trim().length > 0);
              for (let i = 0; i < lines.length; i += 2) {
                if (lines[i] && lines[i+1]) {
                  extractedCards.push({
                    front: lines[i],
                    back: lines[i+1],
                    interval: 0,
                    easeFactor: 2.5,
                    nextReview: Date.now(),
                    deckId: 'temp-id',
                    createdAt: Date.now()
                  });
                }
              }
            }
          }
        }
      }
      
      if (extractedCards.length === 0) {
        extractedCards.push({
          front: 'Sample Card Front (Please edit)',
          back: 'Sample Card Back (Please edit)',
          interval: 0,
          easeFactor: 2.5,
          nextReview: Date.now(),
          deckId: 'temp-id',
          createdAt: Date.now()
        });
      }
      
      setCards(extractedCards);
      toast.dismiss(loadingToast);
      toast.success(`Imported ${extractedCards.length} cards from Anki deck`);
      setStep('cards');
    } catch (error) {
      console.error('Error importing Anki deck:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to import Anki deck. The file might be corrupted or in an unsupported format.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-10 glass-morphism border-b border-border/40 mb-6">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-semibold">
            {createOption === 'deck' 
              ? (step === 'deck' ? 'Criar Novo Deck' : `Adicionar Cartões a "${deck.name}"`) 
              : 'Criar Novo Card'}
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4">
        {!showCreateCard && step === 'deck' && createOption === 'deck' && (
          <div className="max-w-lg mx-auto mb-6">
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => setCreateOption('deck')}
                className={`p-6 rounded-lg border ${
                  createOption === 'deck' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                } flex flex-col items-center justify-center text-center transition-colors`}
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary/20 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="font-medium mb-1">Criar Deck</h3>
                <p className="text-sm text-muted-foreground">Criar um novo deck para seus flashcards</p>
              </button>
              
              <button
                onClick={() => setCreateOption('card')}
                className={`p-6 rounded-lg border ${
                  createOption === 'card' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                } flex flex-col items-center justify-center text-center transition-colors`}
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary/20 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="font-medium mb-1">Criar Card</h3>
                <p className="text-sm text-muted-foreground">Adicionar um novo card a um deck existente</p>
              </button>
            </div>
          </div>
        )}
        
        {createOption === 'deck' && step === 'deck' && !showCreateCard && (
          <form onSubmit={handleDeckSubmit} className="max-w-lg mx-auto space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Nome do Deck
              </label>
              <input
                type="text"
                id="name"
                value={deck.name}
                onChange={(e) => setDeck({ ...deck, name: e.target.value })}
                className="w-full p-3 rounded-lg border border-input focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="e.g., Vocabulary, Phrases, Grammar"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Descrição (opcional)
              </label>
              <textarea
                id="description"
                value={deck.description}
                onChange={(e) => setDeck({ ...deck, description: e.target.value })}
                className="w-full p-3 rounded-lg border border-input focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors min-h-[100px]"
                placeholder="Describe what this deck is for"
              />
            </div>
            
            <div className="flex space-x-3 pt-2">
              <Link
                to="/"
                className="flex-1 py-3 px-4 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors text-center"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                className="flex-1 py-3 px-4 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
              >
                Próximo
              </button>
            </div>
          </form>
        )}
        
        {createOption === 'deck' && step === 'cards' && (
          <div className="max-w-lg mx-auto">
            <div className="mb-6 space-y-2">
              <h2 className="text-lg font-medium">Cartões ({cards.length})</h2>
              <p className="text-muted-foreground">
                Adicione cartões ao seu deck. Você precisará de pelo menos um cartão.
              </p>
            </div>
            
            {showCreateCard ? (
              <CreateCard
                deckId=""
                onSave={handleSaveCard}
                onCancel={() => setShowCreateCard(false)}
              />
            ) : (
              <div className="space-y-4">
                {cards.length > 0 && (
                  <div className="border border-border rounded-lg divide-y divide-border">
                    {cards.map((card, index) => (
                      <div key={index} className="p-4">
                        <div className="flex justify-between mb-1">
                          <div className="font-medium">{card.front}</div>
                          <div className="text-muted-foreground">#{index + 1}</div>
                        </div>
                        <div className="text-sm text-muted-foreground">{card.back}</div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <button 
                    onClick={() => setShowCreateCard(true)}
                    className="flex-1 py-3 px-4 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                  >
                    Adicionar Cartão
                  </button>
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-3 px-4 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
                  >
                    Importar Cartões
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv,.txt,.json,.zip"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setStep('deck')}
                    className="flex-1 py-3 px-4 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleFinish}
                    disabled={isCreating}
                    className="flex-1 py-3 px-4 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isCreating ? 'Criando...' : 'Finalizar Deck'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {createOption === 'card' && (
          <div className="max-w-lg mx-auto space-y-6">
            <div>
              <label htmlFor="deck-select" className="block text-sm font-medium mb-2">
                Selecione o Deck
              </label>
              {existingDecks && existingDecks.length > 0 ? (
                <select
                  id="deck-select"
                  value={selectedDeckId}
                  onChange={(e) => setSelectedDeckId(e.target.value)}
                  className="w-full p-3 rounded-lg border border-input focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                >
                  {existingDecks.map(deck => (
                    <option key={deck.id} value={deck.id}>{deck.name}</option>
                  ))}
                </select>
              ) : (
                <div className="p-4 text-amber-600 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Não há decks disponíveis. <button 
                      onClick={() => setCreateOption('deck')} 
                      className="text-primary underline font-medium"
                    >
                      Crie um deck primeiro.
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {existingDecks && existingDecks.length > 0 && (
              <>
                <div>
                  <label htmlFor="card-front" className="block text-sm font-medium mb-2">
                    Frente do Cartão
                  </label>
                  <textarea
                    id="card-front"
                    value={singleCard.front}
                    onChange={(e) => setSingleCard({ ...singleCard, front: e.target.value })}
                    className="w-full p-3 rounded-lg border border-input focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors min-h-[100px]"
                    placeholder="Conteúdo que aparecerá na frente do cartão"
                  />
                </div>
                
                <div>
                  <label htmlFor="card-back" className="block text-sm font-medium mb-2">
                    Verso do Cartão
                  </label>
                  <textarea
                    id="card-back"
                    value={singleCard.back}
                    onChange={(e) => setSingleCard({ ...singleCard, back: e.target.value })}
                    className="w-full p-3 rounded-lg border border-input focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors min-h-[100px]"
                    placeholder="Conteúdo que aparecerá no verso do cartão (resposta)"
                  />
                </div>
                
                <div className="flex space-x-3 pt-2">
                  <Link
                    to="/"
                    className="flex-1 py-3 px-4 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors text-center"
                  >
                    Cancelar
                  </Link>
                  <button
                    onClick={handleCreateSingleCard}
                    disabled={isCreating || !selectedDeckId}
                    className="flex-1 py-3 px-4 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isCreating ? 'Criando...' : 'Criar Card'}
                  </button>
                </div>
              </>
            )}
            
            <div className="pt-4 text-center">
              <button
                onClick={() => setCreateOption('deck')}
                className="text-primary hover:underline"
              >
                Criar um novo deck em vez disso
              </button>
            </div>
          </div>
        )}
      </main>

      <NavBar />
    </div>
  );
};

export default Create;
