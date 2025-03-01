import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CreateCard from '@/components/CreateCard';
import { Card, Deck } from '@/lib/types';
import NavBar from '@/components/NavBar';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { createDeck, fetchDecks } from '@/lib/deck-service';
import { createCard } from '@/lib/card-service';
import { v4 as uuidv4 } from 'uuid';

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
      toast.error('Por favor, selecione um arquivo válido do Anki (.apkg)');
      return;
    }

    setIsImporting(true);
    const loadingToast = toast.loading('Importando deck do Anki...');

    try {
      console.log('Iniciando processamento do arquivo .apkg:', file.name);
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      
      // Extrair nome do deck do nome do arquivo
      let deckName = file.name.replace('.apkg', '');
      setDeck({
        ...deck,
        name: deck.name || deckName,
        description: deck.description || `Importado do Anki: ${file.name}`
      });
      
      const extractedCards: Omit<Card, 'id'>[] = [];
      let successfulExtraction = false;
      
      // Tenta encontrar o arquivo de banco de dados
      const collectionFile = zip.file('collection.anki2');
      
      if (collectionFile) {
        // Abordagem 1: Extrair dados diretamente do arquivo collection.anki2
        // Este é o arquivo principal do Anki, um banco de dados SQLite
        try {
          console.log('Arquivo collection.anki2 encontrado');
          const collectionData = await collectionFile.async('arraybuffer');
          
          // Processamento simplificado já que não podemos usar SQLite diretamente
          // Vamos buscar padrões de texto nos dados binários
          const textDecoder = new TextDecoder('utf-8');
          const textData = textDecoder.decode(collectionData);
          
          // Buscar por padrões que possam indicar questões e respostas
          const possibleCards = extractPossibleCardsFromText(textData);
          if (possibleCards.length > 0) {
            console.log(`Encontrados ${possibleCards.length} cards pelo método de texto`);
            extractedCards.push(...possibleCards);
            successfulExtraction = true;
          }
        } catch (err) {
          console.error('Erro ao processar collection.anki2:', err);
        }
      }
      
      // Abordagem 2: Procurar por arquivos de mídia ou metadados
      const mediaFile = zip.file('media');
      if (mediaFile && !successfulExtraction) {
        try {
          console.log('Arquivo media encontrado');
          const mediaContent = await mediaFile.async('string');
          const mediaMap = JSON.parse(mediaContent);
          console.log('Mapa de mídia:', mediaMap);
          
          // O arquivo media mapeia IDs para nomes de arquivos
          // Podemos usar isso para encontrar os arquivos de mídia correspondentes
        } catch (err) {
          console.error('Erro ao processar arquivo media:', err);
        }
      }
      
      // Abordagem 3: Procurar por arquivos que possam conter cards
      console.log('Procurando por arquivos potenciais com conteúdo de cards...');
      for (const filename in zip.files) {
        // Pular diretórios e arquivos já processados
        if (zip.files[filename].dir || filename === 'collection.anki2' || filename === 'media') {
          continue;
        }
        
        try {
          // Tentar extrair como texto
          const content = await zip.files[filename].async('string');
          
          // Verificar se o conteúdo parece um JSON
          if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
            try {
              console.log(`Tentando parsear ${filename} como JSON`);
              const jsonData = JSON.parse(content);
              
              // Se for um array, pode conter cards
              if (Array.isArray(jsonData)) {
                for (const item of jsonData) {
                  if (item.front && item.back) {
                    extractedCards.push({
                      front: cleanAnkiText(item.front),
                      back: cleanAnkiText(item.back),
                      interval: 0,
                      easeFactor: 2.5,
                      repetitions: 0,
                      nextReview: Date.now(),
                      deckId: 'temp-id',
                      createdAt: Date.now()
                    });
                  }
                }
                successfulExtraction = true;
                console.log(`Extraídos ${jsonData.length} cards de ${filename}`);
              }
              // Se for um objeto, procurar por propriedades que possam conter cards
              else if (typeof jsonData === 'object' && jsonData !== null) {
                if (jsonData.cards && Array.isArray(jsonData.cards)) {
                  for (const card of jsonData.cards) {
                    if (card.front && card.back) {
                      extractedCards.push({
                        front: cleanAnkiText(card.front),
                        back: cleanAnkiText(card.back),
                        interval: 0,
                        easeFactor: 2.5,
                        repetitions: 0,
                        nextReview: Date.now(),
                        deckId: 'temp-id',
                        createdAt: Date.now()
                      });
                    }
                  }
                  successfulExtraction = true;
                  console.log(`Extraídos ${jsonData.cards.length} cards de ${filename}`);
                }
              }
            } catch (jsonErr) {
              console.log(`Erro ao parsear ${filename} como JSON:`, jsonErr);
            }
          }
          
          // Verificar se contém padrões HTML/texto que indicam cards
          if (!successfulExtraction && (filename.endsWith('.html') || filename.endsWith('.txt'))) {
            console.log(`Processando ${filename} como HTML/texto`);
            const lines = content.split('\n').filter(line => line.trim().length > 0);
            
            if (lines.length >= 2) {
              // Tentar extrair pares de linhas como frente/verso
              for (let i = 0; i < lines.length - 1; i += 2) {
                extractedCards.push({
                  front: cleanAnkiText(lines[i]),
                  back: cleanAnkiText(lines[i+1]),
                  interval: 0,
                  easeFactor: 2.5,
                  repetitions: 0,
                  nextReview: Date.now(),
                  deckId: 'temp-id',
                  createdAt: Date.now()
                });
              }
              console.log(`Extraídos ${Math.floor(lines.length/2)} cards de ${filename}`);
              successfulExtraction = true;
            }
          }
          
          // Verificar padrões CSV/TSV (valores separados por vírgula/tab)
          if (!successfulExtraction && content.includes('\t')) {
            console.log(`Processando ${filename} como CSV/TSV`);
            const lines = content.split('\n').filter(line => line.trim().length > 0);
            
            for (const line of lines) {
              const parts = line.split('\t');
              if (parts.length >= 2) {
                extractedCards.push({
                  front: cleanAnkiText(parts[0]),
                  back: cleanAnkiText(parts[1]),
                  interval: 0,
                  easeFactor: 2.5,
                  repetitions: 0,
                  nextReview: Date.now(),
                  deckId: 'temp-id',
                  createdAt: Date.now()
                });
              }
            }
            console.log(`Extraídos ${extractedCards.length} cards de ${filename} (CSV/TSV)`);
            successfulExtraction = true;
          }
        } catch (fileErr) {
          console.error(`Erro ao processar ${filename}:`, fileErr);
        }
      }
      
      // Método de último recurso: procurar por padrões de texto em todos os arquivos
      if (!successfulExtraction && extractedCards.length === 0) {
        console.log('Tentando método de extração de último recurso');
        
        // Procurar em arquivos com extensões conhecidas
        const potentialCardFiles = Object.keys(zip.files).filter(
          name => !zip.files[name].dir && 
          (name.endsWith('.txt') || name.endsWith('.html') || name.endsWith('.csv') || name.endsWith('.json'))
        );
        
        for (const filename of potentialCardFiles) {
          try {
            const content = await zip.files[filename].async('string');
            
            // Se o conteúdo tiver pelo menos uma linha não vazia
            if (content.trim().length > 0) {
              // Dividir por linhas e tentar criar cards
              const lines = content.split('\n').filter(line => line.trim().length > 0);
              
              // Se tiver pelo menos duas linhas, criar cards com pares de linhas
              if (lines.length >= 2) {
                for (let i = 0; i < lines.length - 1; i += 2) {
                  extractedCards.push({
                    front: cleanAnkiText(lines[i]),
                    back: cleanAnkiText(lines[i+1]),
                    interval: 0,
                    easeFactor: 2.5,
                    repetitions: 0,
                    nextReview: Date.now(),
                    deckId: 'temp-id',
                    createdAt: Date.now()
                  });
                }
                console.log(`Extraídos ${Math.floor(lines.length/2)} cards de ${filename} (último recurso)`);
              }
            }
          } catch (err) {
            console.error(`Erro no método de último recurso para ${filename}:`, err);
          }
        }
      }
      
      // Se ainda não conseguiu extrair cards, criar um card de exemplo
      if (extractedCards.length === 0) {
        console.log('Não foi possível extrair cards. Criando card de exemplo.');
        extractedCards.push({
          front: 'Frente do Cartão de Exemplo (Edite este)',
          back: 'Verso do Cartão de Exemplo (Edite este)',
          interval: 0,
          easeFactor: 2.5,
          repetitions: 0,
          nextReview: Date.now(),
          deckId: 'temp-id',
          createdAt: Date.now()
        });
        toast.info('Não foi possível extrair cards automaticamente. Um card de exemplo foi adicionado.');
      } else {
        console.log(`Total de ${extractedCards.length} cards extraídos com sucesso!`);
      }
      
      // Atualizar o estado com os cards extraídos
      setCards(extractedCards);
      
      // Avançar para a próxima etapa
      setStep('cards');
      
      toast.dismiss(loadingToast);
      toast.success(`Importados ${extractedCards.length} cards do deck Anki`);
    } catch (error) {
      console.error('Erro ao importar deck do Anki:', error);
      toast.dismiss(loadingToast);
      toast.error('Falha ao importar deck do Anki. O arquivo pode estar corrompido ou em um formato não suportado.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Funções auxiliares para processar o texto do Anki
  function cleanAnkiText(text: string): string {
    if (!text) return '';
    
    // Remover tags HTML comuns do Anki
    let cleaned = text.replace(/<div>|<\/div>|<br\s*\/?>|<p>|<\/p>/g, '\n');
    cleaned = cleaned.replace(/<[^>]*>/g, ''); // Remover outras tags HTML
    
    // Substituir entidades HTML
    cleaned = cleaned.replace(/&nbsp;/g, ' ');
    cleaned = cleaned.replace(/&lt;/g, '<');
    cleaned = cleaned.replace(/&gt;/g, '>');
    cleaned = cleaned.replace(/&amp;/g, '&');
    cleaned = cleaned.replace(/&quot;/g, '"');
    
    // Normalizar espaços em branco
    cleaned = cleaned.replace(/\n+/g, '\n').trim();
    
    return cleaned;
  }

  function extractPossibleCardsFromText(text: string): Omit<Card, 'id'>[] {
    const cards: Omit<Card, 'id'>[] = [];
    
    // Padrão 1: Procurar por pares de questão/resposta
    const pattern1 = /question:\s*([^\n]+).*answer:\s*([^\n]+)/gi;
    let match;
    while ((match = pattern1.exec(text)) !== null) {
      if (match[1] && match[2]) {
        cards.push({
          front: cleanAnkiText(match[1]),
          back: cleanAnkiText(match[2]),
          interval: 0,
          easeFactor: 2.5,
          repetitions: 0,
          nextReview: Date.now(),
          deckId: 'temp-id',
          createdAt: Date.now()
        });
      }
    }
    
    // Padrão 2: Procurar por front/back explícitos
    const pattern2 = /front:\s*([^\n]+).*back:\s*([^\n]+)/gi;
    while ((match = pattern2.exec(text)) !== null) {
      if (match[1] && match[2]) {
        cards.push({
          front: cleanAnkiText(match[1]),
          back: cleanAnkiText(match[2]),
          interval: 0,
          easeFactor: 2.5,
          repetitions: 0,
          nextReview: Date.now(),
          deckId: 'temp-id',
          createdAt: Date.now()
        });
      }
    }
    
    return cards;
  }

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
          <div className="max-w-lg mx-auto space-y-6">
            <form onSubmit={handleDeckSubmit} className="space-y-6">
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
              
              <div className="pt-2">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Ou importe um deck existente</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <button 
                    type="button"
                    onClick={handleImportClick}
                    className="w-full py-3 px-4 rounded-lg border border-dashed border-border hover:border-primary/50 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Importar Deck do Anki (.apkg)
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".apkg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
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
          </div>
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
