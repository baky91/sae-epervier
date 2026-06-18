self.addEventListener('install', (event) => {
  console.log('Service Worker: installation.');
});

self.addEventListener('fetch', (event) => {
  // Pour l'instant, nous ne mettons rien en cache.
  // Le Service Worker est juste là pour rendre l'application installable.
});