import React, { useState } from 'react';
import { speakText } from '@/lib/audio';
import { toast } from 'sonner';

interface AudioButtonProps {
  text: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AudioButton: React.FC<AudioButtonProps> = ({ 
  text, 
  className = "", 
  size = 'md' 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    // Impedir a propagação do evento para que o card não vire
    e.stopPropagation();
    
    if (isPlaying) return;
    
    setIsPlaying(true);
    
    try {
      await speakText(text);
      // Aguarde um pouco depois que o áudio terminar para garantir que o estado seja atualizado corretamente
      setTimeout(() => setIsPlaying(false), 300);
    } catch (error) {
      toast.error("Erro ao reproduzir áudio");
      setIsPlaying(false);
    }
  };

  // Determinar o tamanho com base na propriedade size
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPlaying}
      aria-label="Reproduzir áudio"
      className={`relative inline-flex items-center justify-center text-primary hover:text-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full ${className}`}
    >
      {/* Ícone de áudio - Usa SVG inline para facilitar a animação */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={`${sizeClasses[size]}`}
      >
        {isPlaying ? (
          <>
            {/* Ícone de pausa/carregando */}
            <rect x="4" y="2" width="4" height="20" rx="1">
              <animate attributeName="height" values="20;10;20" dur="1s" repeatCount="indefinite" />
            </rect>
            <rect x="12" y="2" width="4" height="20" rx="1">
              <animate attributeName="height" values="10;20;10" dur="1s" repeatCount="indefinite" />
            </rect>
            <rect x="20" y="2" width="4" height="20" rx="1">
              <animate attributeName="height" values="20;10;20" dur="1s" repeatCount="indefinite" />
            </rect>
          </>
        ) : (
          <>
            {/* Ícone de volume/áudio */}
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </>
        )}
      </svg>
    </button>
  );
}; 