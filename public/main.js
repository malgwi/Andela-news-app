// This file is just for testing and going along with the udacity course

function trackInstalling(worker) {
    worker.addEventListener('statechange', function() {
        if (worker.state == 'installed') {
            updateReady(worker);
        }
    });
}
var dbPromise;

function openDatabase(data) {
    dbPromise = idb.open('news', 1, function(upgradeDb) {
        var store = upgradeDb.createObjectStore('newss', {
            keyPath: 'publishedAt'
        });
        store.createIndex('by-date', 'publishedAt');
    });

}

function showCachedMessages() {
    dbPromise.then(function(db) {
        var index = db.transaction('newss')
            .objectStore('newss').index('publishedAt');

        return index.getAll().then(function(messages) {
            // add the messages to posts messages.reverse()
        })
    });
}

function onSocketMessage(data) {
    dbPromise.then(function(db) {
        var tx = db.transaction('newss', 'readwrite');
        var store = tx.objectStore('newss');
        data.forEach(function(message) {
            store.put(message);
        });
        store.index('publishedAt').openCursor(null, 'prev').then(function(cursor) {
            return cursor.advance(30)
        }).then(function deleteRest(cursor) {
            if (!cursor) return;
            cursor.delete();
            return cursor.continue().then(deleteRest);
        });
    });
}

setInterval(function() {
    cleanImageCache();
}, 1000 * 60 * 5);

function cleanImageCache() {
    dbPromise.then(function(db) {
        if (!db) return;

        var imagesNeeded = [];

        var tx = db.transaction('newss');
        return tx.objectStore('newss').getAll().then(function(messages) {
            messages.forEach(function(message) {
                if (message.urlToImage) {
                    imagesNeeded.push(message.urlToImage);
                }
            });

            return caches.open('news-app-imgs');
        }).then(function(cache) {
            return cache.keys().then(function(requests) {
                requests.forEach(function(request) {
                    var url = new URL(request.url);
                    if (!imagesNeeded.includes(url.pathname)) {
                        cache.delete(request);
                    }
                });
            });
        });
    });
}

function updateReady(worker) {
    var answer = prompt("There is an update ready. Enter 'refresh' to update");
    if (answer != 'refresh') return;
    worker.postMessage({
        action: 'skipWaiting'
    });
}

navigator.serviceWorker.register('/sw.js').then(function(reg) {
    // console.log('Yay! am here');
    console.log('favour');
    if (!navigator.serviceWorker.controller) {
        return;
    }

    if (reg.waiting) {
        updateReady()
            // trackInstalling(reg.waiting);
        return;
    }

    if (reg.installing) {
        trackInstalling(reg.installing);
        return;
    }

    reg.addEventListener('updatefound', function() {
        trackInstalling(reg.installing);
    });

    navigator.serviceWorker.addEventListener('controllerchange', function() {
        window.location.reload();
    });
}).catch(function(err) {
    console.log("Boo!");
    console.log(err);
});
$body = $("body");

$(document).on({
    ajaxStart: function() {
        $body.addClass("loading");
    },
    ajaxStop: function() {
        $body.removeClass("loading");
    }
});

$(document).ready(function() {
    API_KEY = 'ae7604c641e5424cb7642a324ba36eca';
    $.ajax({
        url: 'https://newsapi.org/v2/everything?q=apple&from=2018-04-06&to=2018-04-06&sortBy=popularity&apiKey=' + API_KEY,
        success: function(results) {
            for (var i = 0; i < results.articles.length; i++) {
                received = `
                    <div class="thumbnail">
                        <img src="${results.articles[i].urlToImage}" class="img-responsive">
                        <div class="caption">
                            <h3>
                                <a href="${results.articles[i].url}">${results.articles[i].title}</a>
                                <small>${results.articles[i].publishedAt}</small>
                            </h3>
                            <p>Author: ${results.articles[i].author}</p>
                            <p>${results.articles[i].description}</p>
                            <p>
                                <a href="${results.articles[i].url}" class="btn btn-primary" role="button">View</a>
                            </p>
                        </div>
                    </div>
                `;
                $('.col-sm-12').append(received);
            }
        }
    });
});