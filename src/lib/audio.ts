// Utilitário para converter texto em áudio usando a API Eleven Labs

// Nome da variável de ambiente para armazenar a chave da API
const API_KEY_ENV = 'ELEVENLABS_API_KEY';

// Valor padrão para desenvolvimento local - você pode substituir por sua própria chave de API
const DEFAULT_API_KEY = 'sk_4ecb62182a6e1e9a30c722509a2a651381d41ffca8f7b2bb';
const DEFAULT_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'; // ID da voz padrão

// Função para obter a chave da API do ambiente
const getApiKey = (): string => {
  // Em um ambiente de produção, você usaria .env ou variáveis de ambiente
  // Aqui usamos um valor padrão para simplificar
  return DEFAULT_API_KEY;
};

// Função para converter texto em áudio
export async function textToSpeech(text: string, voiceId: string = DEFAULT_VOICE_ID): Promise<Blob> {
  try {
    const apiKey = getApiKey();
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro na API Eleven Labs: ${errorData.detail || response.statusText}`);
    }

    // Converter a resposta em um blob de áudio
    return await response.blob();
  } catch (error) {
    console.error('Erro ao converter texto em áudio:', error);
    throw error;
  }
}

// Função para reproduzir um blob de áudio
export function playAudio(audioBlob: Blob): void {
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  
  audio.onended = () => {
    URL.revokeObjectURL(audioUrl); // Limpar a URL quando terminar de tocar
  };
  
  audio.onerror = (error) => {
    console.error('Erro ao reproduzir áudio:', error);
    URL.revokeObjectURL(audioUrl);
  };
  
  audio.play();
}

// Função para converter e reproduzir texto diretamente
export async function speakText(text: string, voiceId: string = DEFAULT_VOICE_ID): Promise<void> {
  try {
    const audioBlob = await textToSpeech(text, voiceId);
    playAudio(audioBlob);
  } catch (error) {
    console.error('Erro ao converter e reproduzir texto:', error);
    throw error;
  }
} 