const request = require('request-promise');

const { getStreamData, getPlaylistData, getVideoData } = require('./parser_yt_search');

function test(user) {
    return "testing"
}

function getURL(query, options) {
    const url = new URL('/results', 'https://www.youtube.com');
    let sp = [(options.type || 'video')];

    url.search = new URLSearchParams({
        search_query: query
    }).toString();

    if (options.sp) sp = options.sp;

    return url.href + '&sp=' + sp;
}

function extractRenderData(page) {
    return new Promise((resolve, reject) => {
        try {
            // #1 - Remove line breaks
            page = page.split('\n').join('');
            // #2 - Split at start of data
            page = page.split('var ytInitialData')[1];
            // #3 - Remove the first equals sign
            const spot = page.split('=');
            spot.shift();
            // #4 - Join the split data and split again at the closing tag
            const data = spot.join('=').split(';</script>')[0];

            let render = null;
            let contents = [];
            const primary = JSON.parse(data).contents
                .twoColumnSearchResultsRenderer
                .primaryContents;


            // The renderer we want. This should contain all search result information
            if (primary['sectionListRenderer']) {

                // Filter only the search results, exclude ads and promoted content
                render = primary.sectionListRenderer.contents.filter((item) => {
                    return (
                        item.itemSectionRenderer &&
                        item.itemSectionRenderer.contents &&
                        item.itemSectionRenderer.contents.filter((c) => c['videoRenderer'] || c['playlistRenderer']).length
                    );
                }).shift();

                contents = render.itemSectionRenderer.contents;
            }

            // YouTube occasionally switches to a rich grid renderer.
            // More testing will be needed to see how different this is from sectionListRenderer
            if (primary['richGridRenderer']) {
                contents = primary.richGridRenderer.contents.filter((item) => {
                    return item.richItemRenderer && item.richItemRenderer.content;
                }).map((item) => item.richItemRenderer.content);
            }

            resolve(contents);
        } catch (e) {
            reject(e);
        }
    });
}

function parseData(data)  {
    return new Promise((resolve, reject) => {
        try {
            const results = {
                videos: [],
                playlists: [],
                streams: []
            };

            data.forEach((item) => {
                if (item['videoRenderer'] && item['videoRenderer']['lengthText']) {
                    try {
                        const result = getVideoData(item['videoRenderer']);
                        results.videos.push(result);
                    } catch (e) {
                        console.log(e)
                    }
                }

                if (item['videoRenderer'] && !item['videoRenderer']['lengthText']) {
                    try {
                        const result = getStreamData(item['videoRenderer']);
                        results.streams.push(result);
                    } catch (e) {
                        console.log(e)
                    }
                }

                if (item['playlistRenderer']) {
                    try {
                        const result = getPlaylistData(item['playlistRenderer']);
                        results.playlists.push(result);
                    } catch (e) {
                        console.log(e);
                    }
                }
            });

            resolve(results);
        } catch (e) {
            console.warn(e);
            reject('Fatal error when parsing result data. Please report this on GitHub');
        }
    });
}

/**
     * Load the page and scrape the data
     * @param query Search query
     * @param options Search options
     */
function load(query, options) {
    const url = getURL(query, options);


    return new Promise((resolve, reject) => {
        request({
            url: url,
            proxy: 'http://user-cashmachine:Octatrack2$@gate.smartproxy.com:7000',
            headers: {
                'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Safari/537.36.'
            }
        })
        .then((response) => {resolve(response)})
        .catch(console.error);
    });


}

function getDebugID() {
    return `${Math.random()}`.replace('.', '');
}
  

exports.search = function(query, options) {
    return new Promise(async (resolve, reject) => {
        try {
            options = { ...options, _debugid: getDebugID() };
            const page = await load(query, options);
            const data = await extractRenderData(page);
            const results = await parseData(data);

            /**
             * This will create 3 files in the debugger directory.
             * It's not recommended to leave this enabled. Only when asked by DrKain via GitHub
             */
            // if (this.debug && this.debugger.enabled && options._debugid) {
            //     this.debugger.dump(options._debugid, 'vids', results);
            //     this.debugger.dump(options._debugid, 'opts', query );
            //     this.debugger.dump(options._debugid, 'page', page);
            // }

            resolve(results);
        } catch (e) {
            reject(e);
        }
    });
}