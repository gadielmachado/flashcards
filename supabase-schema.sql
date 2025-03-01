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

-- Adicionar índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_decks_created_at ON public.decks(created_at);
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON public.decks(user_id);

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

-- Adicionar índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON public.cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_cards_next_review ON public.cards(next_review);

-- Adicionar políticas RLS para segurança (opcional)
-- Essas políticas permitem acesso anônimo para simplificar,
-- mas você pode querer restringir o acesso baseado em usuário em uma aplicação real

-- Permitir acesso anônimo para leitura de decks
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous select on decks" ON public.decks
    FOR SELECT USING (true);

-- Permitir acesso anônimo para inserção em decks
CREATE POLICY "Allow anonymous insert on decks" ON public.decks
    FOR INSERT WITH CHECK (true);

-- Permitir acesso anônimo para atualização em decks
CREATE POLICY "Allow anonymous update on decks" ON public.decks
    FOR UPDATE USING (true);

-- Permitir acesso anônimo para exclusão em decks
CREATE POLICY "Allow anonymous delete on decks" ON public.decks
    FOR DELETE USING (true);

-- Permitir acesso anônimo para leitura de cards
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous select on cards" ON public.cards
    FOR SELECT USING (true);

-- Permitir acesso anônimo para inserção em cards
CREATE POLICY "Allow anonymous insert on cards" ON public.cards
    FOR INSERT WITH CHECK (true);

-- Permitir acesso anônimo para atualização em cards
CREATE POLICY "Allow anonymous update on cards" ON public.cards
    FOR UPDATE USING (true);

-- Permitir acesso anônimo para exclusão em cards
CREATE POLICY "Allow anonymous delete on cards" ON public.cards
    FOR DELETE USING (true);

-- Comentário explicativo sobre como usar este script
COMMENT ON TABLE public.decks IS 'Tabela para armazenar os decks de flashcards';
COMMENT ON TABLE public.cards IS 'Tabela para armazenar os cards individuais de flashcards'; 