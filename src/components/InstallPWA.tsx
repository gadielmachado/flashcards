import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

const InstallPWA: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Previne que o Chrome mostre automaticamente o prompt de instalação
      e.preventDefault();
      // Armazena o evento para usar mais tarde
      setInstallPrompt(e);
      // Mostra o banner de instalação personalizado
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Verifica se o app já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) return;

    // Mostra o prompt de instalação
    installPrompt.prompt();

    // Espera pelo resultado
    installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        toast.success('Obrigado por instalar nosso aplicativo!');
        setShowInstallBanner(false);
      } else {
        toast.info('Você pode instalar o app mais tarde se desejar.');
      }
      setInstallPrompt(null);
    });
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-16 left-4 right-4 p-4 bg-primary text-white rounded-lg shadow-lg z-50 flex items-center justify-between">
      <div>
        <h3 className="font-medium">Instalar Flashlearn</h3>
        <p className="text-sm opacity-90">Adicione à tela inicial para acesso rápido</p>
      </div>
      <div className="flex gap-2">
        <button 
          className="px-4 py-2 text-sm bg-white text-primary font-medium rounded-md"
          onClick={handleInstallClick}
        >
          Instalar
        </button>
        <button 
          className="px-3 py-2 text-sm text-white/80"
          onClick={() => setShowInstallBanner(false)}
        >
          Depois
        </button>
      </div>
    </div>
  );
};

export default InstallPWA; 