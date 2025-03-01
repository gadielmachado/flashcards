import React, { useState, useRef } from 'react';
import { Card, MediaType } from '@/lib/types';
import CardFlip from './ui/card-flip';
import { ImageIcon, VideoIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { AudioButton } from './ui/audio-button';

interface CreateCardProps {
  deckId: string;
  onSave: (card: Omit<Card, 'id'>) => void;
  onCancel: () => void;
}

const CreateCard: React.FC<CreateCardProps> = ({ deckId, onSave, onCancel }) => {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [frontMedia, setFrontMedia] = useState<{type: MediaType, url: string} | null>(null);
  const [backMedia, setBackMedia] = useState<{type: MediaType, url: string} | null>(null);
  
  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!front.trim() && !frontMedia) {
      toast.error("Please add content to the front side");
      return;
    }
    
    if (!back.trim() && !backMedia) {
      toast.error("Please add content to the back side");
      return;
    }
    
    const newCard: Omit<Card, 'id'> = {
      front: front.trim(),
      back: back.trim(),
      deckId,
      createdAt: Date.now(),
    };

    if (frontMedia) {
      newCard.frontMedia = frontMedia;
    }

    if (backMedia) {
      newCard.backMedia = backMedia;
    }
    
    onSave(newCard);
    
    // Reset form
    setFront('');
    setBack('');
    setIsFlipped(false);
    setFrontMedia(null);
    setBackMedia(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5MB");
      return;
    }

    const fileType = file.type.split('/')[0];
    if (fileType !== 'image' && fileType !== 'video') {
      toast.error("Only image and video files are supported");
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = () => {
      const url = fileReader.result as string;
      const mediaType: MediaType = fileType as 'image' | 'video';
      
      if (side === 'front') {
        setFrontMedia({ type: mediaType, url });
      } else {
        setBackMedia({ type: mediaType, url });
      }
    };
    fileReader.readAsDataURL(file);
  };

  const removeMedia = (side: 'front' | 'back') => {
    if (side === 'front') {
      setFrontMedia(null);
      if (frontFileInputRef.current) {
        frontFileInputRef.current.value = '';
      }
    } else {
      setBackMedia(null);
      if (backFileInputRef.current) {
        backFileInputRef.current.value = '';
      }
    }
  };

  const renderMedia = (media: {type: MediaType, url: string} | null) => {
    if (!media) return null;

    if (media.type === 'image') {
      return (
        <img 
          src={media.url} 
          alt="Card media" 
          className="max-h-32 max-w-full object-contain mx-auto my-2 rounded"
        />
      );
    }

    if (media.type === 'video') {
      return (
        <video 
          src={media.url} 
          controls 
          className="max-h-32 max-w-full mx-auto my-2 rounded"
        />
      );
    }

    return null;
  };

  const cardFront = (
    <div className="flex flex-col justify-between h-full p-6">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
        Front side
      </div>
      <div className="flex-grow flex flex-col items-center justify-center text-xl font-medium">
        {frontMedia && renderMedia(frontMedia)}
        <div className="flex items-center gap-2">
          {front || <span className="text-muted-foreground">Front side content</span>}
          {front && <AudioButton text={front} size="sm" className="ml-2" />}
        </div>
      </div>
      <div className="text-xs text-center text-muted-foreground mt-4">
        Preview
      </div>
    </div>
  );

  const cardBack = (
    <div className="flex flex-col justify-between h-full p-6">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
        Back side
      </div>
      <div className="flex-grow flex flex-col items-center justify-center text-xl font-medium">
        {backMedia && renderMedia(backMedia)}
        <div className="flex items-center gap-2">
          {back || <span className="text-muted-foreground">Back side content</span>}
          {back && <AudioButton text={back} size="sm" className="ml-2" />}
        </div>
      </div>
      <div className="text-xs text-center text-muted-foreground mt-4">
        Preview
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-6 h-64">
        <CardFlip
          front={cardFront}
          back={cardBack}
          isFlipped={isFlipped}
          onFlip={setIsFlipped}
          frontClassName="bg-white rounded-xl shadow-md border border-border"
          backClassName="bg-white rounded-xl shadow-md border border-border"
        />
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="front" className="block text-sm font-medium mb-1">
            Front
          </label>
          <input
            type="text"
            id="front"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            className="w-full p-3 rounded-lg border border-input focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            placeholder="e.g., Word in English"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Front Media (optional)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={frontFileInputRef}
              accept="image/*,video/*"
              onChange={(e) => handleFileChange(e, 'front')}
              className="hidden"
              id="front-media"
            />
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => frontFileInputRef.current?.click()}
                className="flex items-center space-x-1 py-2 px-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Add Media</span>
              </button>
              {frontMedia && (
                <button
                  type="button"
                  onClick={() => removeMedia('front')}
                  className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {frontMedia && (
            <div className="mt-2 border border-input rounded-lg p-2 flex items-center">
              {frontMedia.type === 'image' ? (
                <ImageIcon className="w-4 h-4 mr-2" />
              ) : (
                <VideoIcon className="w-4 h-4 mr-2" />
              )}
              <span className="text-sm truncate">Media attached</span>
            </div>
          )}
        </div>
        
        <div>
          <label htmlFor="back" className="block text-sm font-medium mb-1">
            Back
          </label>
          <input
            type="text"
            id="back"
            value={back}
            onChange={(e) => setBack(e.target.value)}
            className="w-full p-3 rounded-lg border border-input focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            placeholder="e.g., Translation or definition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Back Media (optional)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={backFileInputRef}
              accept="image/*,video/*"
              onChange={(e) => handleFileChange(e, 'back')}
              className="hidden"
              id="back-media"
            />
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => backFileInputRef.current?.click()}
                className="flex items-center space-x-1 py-2 px-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Add Media</span>
              </button>
              {backMedia && (
                <button
                  type="button"
                  onClick={() => removeMedia('back')}
                  className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {backMedia && (
            <div className="mt-2 border border-input rounded-lg p-2 flex items-center">
              {backMedia.type === 'image' ? (
                <ImageIcon className="w-4 h-4 mr-2" />
              ) : (
                <VideoIcon className="w-4 h-4 mr-2" />
              )}
              <span className="text-sm truncate">Media attached</span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-3 px-4 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
          >
            Save Card
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCard;
