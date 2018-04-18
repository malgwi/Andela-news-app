var staticCacheName = 'news-app-v4';
var contentImgsCache = 'news-app-imgs';
var allCaches = [
    staticCacheName,
    contentImgsCache
];
//favour is a
self.addEventListener('install', function(event) {
    var urlsToCache = [
        '/',
        'bootstrap/css/bootstrap.min.css',
        'stylesheets/style.css',
        'jquery/jquery-1.11.1.min.js',
        'bootstrap/js/bootstrap.min.js',
        'app.js'
        // 'https://newsapi.org/v2/everything?q=apple&from=2018-04-17&to=2018-04-17&sortBy=popularity&apiKey=ae7604c641e5424cb7642a324ba36eca'
    ];
    event.waitUntil(
        caches.open(staticCacheName).then(function(cache) {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(cacheName) {
                    return cacheName.startsWith('news-') &&
                        !allCaches.includes(cacheName);
                }).map(function() {
                    return cache.delete(cacheName);
                })
            )
        })
    );
});

self.addEventListener('fetch', function(event) {

    var requestUrl = new URL(event.request.url);

    if (requestUrl.pathname.endsWith('.jpg')) {
        event.respondWith(servePhoto(event.request));
        return;
    }
});

function servePhoto(request) {
    // var storageUrl = request.url.replace(/-\d+px\.jpg$/, '');
    var storageUrl = request.url;
    return caches.open(contentImgsCache).then(function(cache) {
        return cache.match(storageUrl).then(function(response) {
            if (response) return response;

            return fetch(request).then(function(networkResponse) {
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            });
        });
    });
}

self.addEventListener('message', function(event) {
    if (event.data.action == 'skipWaiting') {
        self.skipWaiting();
    }
});