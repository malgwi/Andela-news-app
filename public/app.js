var country_name = 'ng';

function trackInstalling(worker) {
    worker.addEventListener('statechange', function() {
        if (worker.state == 'installed') {
            updateReady(worker);
        }
    });
}

function updateReady(worker) {
    var answer = prompt("There is an update ready. Enter 'refresh' to update");
    if (answer != 'refresh') return;
    worker.postMessage({
        action: 'skipWaiting'
    });
}

var dbPromise = idb.open('news', 1, function(upgradeDb) {
    var store = upgradeDb.createObjectStore('newss', {
        keyPath: 'publishedAt'
    });
    store.createIndex('by-date', 'publishedAt');
});

navigator.serviceWorker.register('/serviceworker.js').then(function(reg) {
    console.log('favour');
    if (!navigator.serviceWorker.controller) {
        return;
    }

    if (reg.waiting) {
        updateReady()
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

function fetchNews(country) {
    var API_KEY = 'ae7604c641e5424cb7642a324ba36eca';
    var newsurl = `https://newsapi.org/v2/top-headlines?country=ng&apiKey=ae7604c641e5424cb7642a324ba36eca`;
    fetch(`https://newsapi.org/v2/top-headlines?country=ng&apiKey=ae7604c641e5424cb7642a324ba36eca`)
        .then(response => response.json())
        .then(function(results) {
            var data = results.articles;
            dbPromise.then(function(db) {
                var tx = db.transaction('newss', 'readwrite');
                var store = tx.objectStore('newss');
                data.forEach(function(news) {
                    store.put(news);
                });
                store.index('by-date').openCursor(null, 'prev').then(function(cursor) {
                    return cursor.advance(30);
                }).then(function deleteRest(cursor) {
                    if (!cursor) return;
                    cursor.delete();
                    return cursor.continue().then(deleteRest);
                });
            });
            loadPosts(data);
        });
}

function getAllSources() {
    var API_KEY = 'ae7604c641e5424cb7642a324ba36eca';
    fetch(`https://newsapi.org/v2/sources?apiKey=${API_KEY}`)
        .then(response => response.json())
        .then(function(results) {
            var toadd = `
                <option>Choose your source....</option>
            ` + results.sources.map(data => `<option value="${data.id}">${data.name}</option>`).join("");
            $('#sources_filter').html(toadd);
        });
}

function loadPosts(data) {
    var toadd = data.map(news => `
            <div class="thumbnail">
                <img src="${news.urlToImage}" class="img-responsive">
                <div class="caption">
                    <h3>
                        <a href="${news.url}" target="_blank">${news.title}</a>
                        <small>${news.publishedAt}</small>
                    </h3>
                    <p>Author: ${news.author}</p>
                    <p>${news.description}</p>
                    <p>
                        <a href="${news.url}" target="_blank" class="btn btn-primary" role="button">View</a>
                    </p>
                </div>
            </div>`).join("");

    $('.col-sm-12').html(toadd);

}

function showCachedNews() {
    console.log('santos is cached messages');
    dbPromise.then(function(db) {
        var index = db.transaction('newss')
            .objectStore('newss').index('by-date');

        return index.getAll().then(function(messages) {
            // add the messages to posts messages.reverse()
            loadPosts(messages.reverse());
        });
    });
}

window.addEventListener('load', function() {
    console.log('santos is awesome');
    showCachedNews();

    fetchNews(country_name);
    getAllSources();
});
$('#country_filter').change(function(e) {
    console.log(e.target.value);
    var country = e.target.value;
    fetchNews(country);
});
$('#sources_filter').change(function(e) {
    console.log("Sources filter seen");
    var source = e.target.value;
    console.log(source);
    var API_KEY = 'ae7604c641e5424cb7642a324ba36eca';
    fetch(`https://newsapi.org/v2/top-headlines?sources=${source}&apiKey=${API_KEY}`)
        .then(response => response.json())
        .then(function(data) {
            loadPosts(data.articles)
        });
});