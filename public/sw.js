// This file is just for testing and going along with the udacity course

var staticCacheName = 'news-app-v4';
var contentImgsCache = 'news-app-imgs';
var allCaches = [
    staticCacheName,
    contentImgsCache
];
// this is a car
self.addEventListener('install', function (event) {
    var urlsToCache = [
        '/',
        'bootstrap/css/bootstrap.min.css',
        'stylesheets/style.css',
        'jquery/jquery-1.11.1.min.js',
        'bootstrap/js/bootstrap.min.js',
        'main.js'
        // 'https://newsapi.org/v2/everything?q=apple&from=2018-04-06&to=2018-04-06&sortBy=popularity&apiKey=85e93f2021e248a58e0f930602b9c8b3'
    ];
    event.waitUntil(
        caches.open(staticCacheName).then(function (cache) {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (cacheName) {
                    return cacheName.startsWith('news-') &&
                        !allCaches.includes(cacheName);
                }).map(function () {
                    return cache.delete(cacheName);
                })
            )
        })
    );
});

self.addEventListener('fetch', function(event) {

    var requestUrl = new URL(event.request.url);

    if(requestUrl.origin === location.origin) {
        if (requestUrl.pathname === '/') {
            event.respondWith(caches.match('/'));
            return;
        }
        if (requestUrl.pathname.endsWith('.jpg')) {
            event.respondWith(servePhoto(event.request));
            return;
        }
    }

    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request)
        })
    );
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

function serveAvatar(request) {
    var storageUrl = request.url;
    return caches.open(contentImgsCache).then(function(cache) {
        return cache.match(storageUrl).then(function(response) {
            var networkFetch = fetch(request).then(function(networkResponse) {
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            });

            return response || networkFetch;
        });
    });
}

// self.addEventListener('fetch', function (event) {
//     event.respondWith(
//         caches.match(event.request).then(function (response) {
//             if (response) return response;
//             return fetch(event.request);
//         })
//     );
//     // console.log(event.request.url);
//     // event.respondWith(
//     //     new Response('Hello <strong>world</strong>', {
//     //         headers: {'Content-Type': 'text/html'}
//     //     })
//     // );
//     // if (event.request.url.endsWith('.jpg')) {
//     //     event.respondWith(
//     //         fetch('/images/car.jpg')
//     //     )
//     // }
//     // console.log(event.request.url);
//     // event.respondWith(
//     //     fetch(event.request).then(function(response) {
//     //         if(response.status == 404) {
//     //             return fetch('/images/thrillist-404.jpg');
//     //         }
//     //         return response;
//     //     }).catch(function() {
//     //         return new Response('Un oh, that totally failed!')
//     //     })
//     // )
// });

self.addEventListener('message', function(event) {
    if(event.data.action == 'skipWaiting') {
         self.skipWaiting();
    }
});