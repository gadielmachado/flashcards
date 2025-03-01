# Configuração do Supabase para o Flashlearn-Spiral

Este documento explica como configurar o banco de dados Supabase para o aplicativo Flashlearn-Spiral.

## Pré-requisitos

1. Ter uma conta no [Supabase](https://supabase.com)
2. Ter criado um projeto no Supabase

## Passo 1: Criar as tabelas necessárias

1. Acesse o painel de controle do seu projeto Supabase
2. Vá para a seção "SQL Editor" (Editor SQL)
3. Crie uma nova consulta e cole o conteúdo do arquivo `supabase-schema.sql`
4. Execute a consulta

## Passo 2: Verificar as configurações de conexão

1. No arquivo `src/lib/supabase.ts`, verifique se a URL e a chave API estão configuradas corretamente
2. Substitua a URL e a chave API pelos valores do seu projeto Supabase:

```typescript
const supabaseUrl = 'SUA_URL_SUPABASE';
const supabaseKey = 'SUA_CHAVE_ANON_SUPABASE';
```

Você pode encontrar essas informações no painel do Supabase, em "Settings" > "API".

## Passo 3: Testar a conexão

1. Inicie a aplicação com `npm run dev`
2. Verifique se consegue criar, visualizar, atualizar e excluir decks e cards
3. Se aparecer a mensagem "Erro ao conectar ao banco de dados", revise os passos anteriores

## Solução de problemas comuns

### Erro de conexão com o banco de dados

Se você vir a mensagem "Erro ao conectar ao banco de dados", pode ser devido a:

1. **URL ou chave API incorretas**: Verifique se as credenciais em `src/lib/supabase.ts` estão corretas
2. **Tabelas não existem**: Execute o script SQL para criar as tabelas
3. **Políticas RLS**: Verifique se as políticas RLS (Row Level Security) permitem acesso anônimo

### Erro "Tabela 'decks' não existe"

Este erro indica que o banco de dados está acessível, mas as tabelas necessárias não foram criadas. Execute o script SQL conforme explicado no Passo 1.

### Dados não são salvos

Se os dados estão sendo salvos apenas localmente:

1. Verifique sua conexão com a internet
2. Verifique as políticas RLS no Supabase
3. Verifique o console do navegador para ver detalhes sobre os erros

## Configuração avançada

Para um ambiente de produção, recomenda-se:

1. Implementar autenticação de usuários
2. Modificar as políticas RLS para restringir acesso baseado no ID do usuário
3. Configurar variáveis de ambiente para armazenar as credenciais do Supabase

---

Em caso de dúvidas ou problemas, consulte a [documentação oficial do Supabase](https://supabase.com/docs). 