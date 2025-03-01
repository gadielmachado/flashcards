import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Deck } from '@/lib/types';
import ProgressCircle from './ui/progress-circle';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { toast } from 'sonner';

interface DeckListProps {
  decks: Deck[];
  onDeleteDeck?: (deckId: string) => void;
}

const DeckList: React.FC<DeckListProps> = ({ decks, onDeleteDeck }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<string | null>(null);

  if (decks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="text-muted-foreground mb-4">
          No decks yet
        </div>
        <Link 
          to="/create" 
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
        >
          Create your first deck
        </Link>
      </div>
    );
  }

  const handleDeleteClick = (e: React.MouseEvent, deckId: string, deckName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeckToDelete(deckId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deckToDelete && onDeleteDeck) {
      onDeleteDeck(deckToDelete);
      toast("Deck deleted successfully");
    }
    setIsDeleteDialogOpen(false);
    setDeckToDelete(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
        {decks.map(deck => {
          const duePercentage = deck.totalCards > 0 ? (deck.dueCards / deck.totalCards) * 100 : 0;
          const completedPercentage = deck.totalCards > 0 ? 100 - duePercentage : 0;
          
          return (
            <div key={deck.id} className="relative group">
              <Link 
                to={`/study/${deck.id}`}
                className="block p-4 rounded-xl bg-white border border-border shadow-sm hover:shadow-md transition-all duration-300 ease-apple-ease"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-lg group-hover:text-primary transition-colors">
                    {deck.name}
                  </h3>
                  <ProgressCircle 
                    progress={completedPercentage} 
                    size={32}
                    className="text-primary"
                  />
                </div>
                
                <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                  {deck.description}
                </p>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {deck.totalCards} cards
                  </span>
                  {deck.dueCards > 0 ? (
                    <span className="text-primary font-medium">
                      {deck.dueCards} due
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      All reviewed
                    </span>
                  )}
                </div>
              </Link>
              <button
                onClick={(e) => handleDeleteClick(e, deck.id, deck.name)}
                className="absolute top-2 right-2 p-2 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Delete ${deck.name} deck`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              deck and all of its cards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DeckList;
