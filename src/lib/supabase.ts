import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

const supabaseUrl = 'https://hrpknojaagiilklssrma.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycGtub2phYWdpaWxrbHNzcm1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NTM3NDcsImV4cCI6MjA1NjQyOTc0N30.ywu-_HP0KONkZ6Fv_X4Bya3375kZr7ZN3nvCheDyyvg';

// Opções para o cliente Supabase
const options = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'flashlearn-spiral-app',
    },
  },
};

// Criar cliente com opções otimizadas
export const supabase = createClient(supabaseUrl, supabaseKey, options);

// Função para verificar a conexão com o Supabase
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    // Tentar operação simples para verificar conectividade
    const { data, error } = await supabase.from('decks').select('count', { count: 'exact', head: true });
    
    if (error) {
      // Se o erro for 'relation "decks" does not exist', significa que o banco de dados está acessível,
      // mas as tabelas necessárias não estão criadas
      if (error.message && error.message.includes('relation "decks" does not exist')) {
        console.error('Tabela "decks" não existe no Supabase. É necessário criar a estrutura do banco de dados.');
        toast.error('Estrutura do banco de dados não configurada corretamente');
        
        // Criar a tabela automaticamente se ela não existir
        try {
          await createDatabaseTables();
          return true;  // Tentou criar as tabelas
        } catch (createError) {
          console.error('Erro ao criar tabelas:', createError);
          return false;
        }
      }
      
      // Outros erros de conexão
      console.error('Erro ao verificar conexão com Supabase:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao verificar conexão com Supabase:', error);
    return false;
  }
};

// Função auxiliar para criar as tabelas necessárias
async function createDatabaseTables() {
  // Script SQL para criar tabelas
  const createTablesSQL = `
    -- Criar tabela para decks
    CREATE TABLE IF NOT EXISTS public.decks (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        total_cards INTEGER DEFAULT 0,
        due_cards INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
        user_id UUID
    );

    -- Criar tabela para cards
    CREATE TABLE IF NOT EXISTS public.cards (
        id UUID PRIMARY KEY,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
        last_reviewed TIMESTAMP WITH TIME ZONE,
        next_review TIMESTAMP WITH TIME ZONE,
        interval FLOAT,
        ease_factor FLOAT DEFAULT 2.5,
        repetitions INTEGER DEFAULT 0,
        front_media JSONB,
        back_media JSONB
    );
  `;
  
  // Tentar executar o script SQL
  const { error } = await supabase.rpc('exec_sql', { sql: createTablesSQL });
  if (error) throw error;
  
  console.log('Tabelas criadas com sucesso');
  toast.success('Banco de dados configurado com sucesso');
}

// Interface para deck no Supabase
export interface SupabaseDeck {
  id: string;
  name: string;
  description: string;
  total_cards: number;
  due_cards: number;
  created_at: string;
  user_id?: string;
}

// Interface para card no Supabase
export interface SupabaseCard {
  id: string;
  front: string;
  back: string;
  deck_id: string;
  created_at: string;
  last_reviewed?: string;
  next_review?: string;
  interval?: number;
  ease_factor?: number;
  repetitions?: number;
  front_media?: {
    type: string | null;
    url: string;
  };
  back_media?: {
    type: string | null;
    url: string;
  };
}

// Funções auxiliares para lidar com erros
export const handleSupabaseError = (error: Error) => {
  console.error('Erro Supabase:', error);
  
  // Mostrar detalhes adicionais no console para debug
  if (error instanceof Error) {
    console.log('Detalhes do erro:', error.message);
    
    // Mensagens específicas para erros comuns
    if (error.message.includes('relation "decks" does not exist')) {
      toast.error('Banco de dados não configurado. Dados serão salvos localmente.');
      return;
    }
    
    if (error.message.includes('network error') || error.message.includes('fetch')) {
      toast.error('Erro de conexão. Verifique sua internet. Dados serão salvos localmente.');
      return;
    }
  }
  
  // Mensagem genérica
  toast.error('Erro ao conectar ao banco de dados');
}; 