// Nome do cache do aplicativo
const CACHE_NAME = 'flashlearn-spiral-v1';

// Lista de recursos a serem armazenados em cache
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
  // Outros recursos estáticos como CSS, JS, imagens
  // Você pode adicionar mais conforme necessário
];

// Evento de instalação: cria o cache e armazena recursos iniciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Cache aberto');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting(); // Força a ativação imediata em todas as guias
});

// Evento de ativação: limpa caches antigos
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName); // Remove caches antigos
          }
        })
      );
    })
  );
  self.clients.claim(); // Assume o controle imediatamente
});

// Estratégia Cache First com fallback para Network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - retorna a resposta do cache
      if (response) {
        return response;
      }

      // Copia a requisição, pois ela só pode ser consumida uma vez
      return fetch(event.request).then((response) => {
        // Verifica se recebemos uma resposta válida
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone a resposta para poder armazenar no cache e retornar
        const responseToCache = response.clone();

        // Armazena a requisição no cache para usos futuros
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Se falhar, tenta retornar uma página offline
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      });
    })
  );
});

// Evento para sincronizar dados quando a conexão for restabelecida
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-flashcards') {
    event.waitUntil(syncFlashcards());
  }
});

// Função para sincronizar dados quando estiver online
async function syncFlashcards() {
  // Implemente a lógica para sincronizar dados com o servidor
  // quando o dispositivo estiver online novamente
  console.log('Sincronizando dados...');
  // Aqui você pode implementar a lógica para enviar dados
  // armazenados localmente para o Supabase
} 