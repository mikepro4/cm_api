var CronJob = require('cron').CronJob;
const _ = require("lodash");
const mongoose = require("mongoose");
const request = require('request-promise');

const YoutubeSearch = require("./scrape_yt_search");
const Video = mongoose.model("videos");
const Ticker = mongoose.model("tickers");
const Proxy = mongoose.model("proxies");

let currentVideo = 0
let videoCount = 0
let running = true

function checkVideo(video, ticker) {
    return new Promise(async (resolve, reject) => {

        try {
            const shouldAddVideo = Video.findOne(
                {
                    googleId: { $eq: video.id }
                },
                async(err, result) => {
                    if(!result) {
                        // console.log("add video")

                        const newVideo = await new Video({
                            createdAt: new Date(),
                            linkedTickers: [
                                {
                                    symbol: ticker
                                }
                            ],
                            googleId: video.id,
                            metadata: video,
                        }).save();

                        if(newVideo) {
                            resolve(video)
                        }
                    } else {

                        let linked = _.find(result.linkedTickers, { symbol: ticker})
                        
                        if (!linked) {

                            let newLinked = [
                                ...result.linkedTickers,
                                {
                                    symbol: ticker
                                }
                            ]

                            Video.update(
                                {
                                    _id: result._id
                                },
                                {
                                    $set: { linkedTickers: newLinked }
                                },
                                async (err, info) => {
                                    if (info) {


                                        Video.findOne({ _id: result._id }, async (err, video) => {
                                            if (video) {
                                                // console.log("update video")
                                                resolve(video)
                                            }
                                        });
                                    }
                                }
                            );
                        } else {
                            // console.log("reject video")
                        }
                    }
                }
            );


        } catch (e) {
            reject(e);
        }
        
    })
}

function searchVideos(ticker) {
    return Proxy.aggregate([{ $sample: { size: 1 } }]).then(random => {

        // const options = {
        //     requestOptions: {
        //         host: results[0].metadata.ip,
        //         port: parseInt(results[0].metadata.port)
        //     }
        // };

        let proxy = random[0].metadata.ip

        YoutubeSearch.search(
                ticker, 
                {sp: "CAISBAgCEAE%253D"},
                proxy
            )
            .then(results => {
            results.videos.map((result) => {
                return checkVideo(result, ticker)
            })
        }).catch((err) => console.log(err));
    });
}

loadFirstTicker = async (req, res) => {
    const query = Ticker.find()
			.sort({ "metadata.symbol": "1" })
			.skip(0)
            .limit(1);
            
    return Promise.all(
        [query, Ticker.find().countDocuments()]
    ).then(
        results => {
            let symbol = results[0]
            currentVideo = 0
            videoCount = results[1]

            let finalSymbol = symbol[0].metadata.symbol


            if(symbol[0] && symbol[0].metadata) {
                setTimeout(() => {
                    searchVideos(finalSymbol)
                    if(running) {
                        loadNextTicker()
                    }

                    return console.log({
                        ticker: symbol[0].metadata.symbol,
                        count: results[1]
                    });
                }, 1000)
                
            }

            
        }
    );
}

loadNextTicker = async (req, res) => {
    currentVideo = currentVideo + 1

    const query = Ticker.find()
			.sort({ "metadata.symbol": "1" })
			.skip(currentVideo)
            .limit(1);
            
    return Promise.all(
        [query, Ticker.find().countDocuments()]
    ).then(
        results => {
            let symbol = results[0]

            if(symbol[0].metadata) {
                searchVideos(symbol[0].metadata.symbol)

                setTimeout(() => {
                    if(currentVideo  < results[1] -1) {
                        if(running) {
                            loadNextTicker()
                        }
                    } else{
                        currentVideo = 0
                        setTimeout(() => {
                            if(running) {
                                loadFirstTicker()
                            }
                        }, 10000)
                    }

                    return console.log({
                        ticker: symbol[0].metadata.symbol,
                        count: results[1]
                    });
                }, 1000)

                
            }
        }
    );
}

exports.toggleScraper = () => {
    if(running) {
        running = false
    } else {
        running = true
        loadFirstTicker()
    }
}

var job = new CronJob(
    '*/40 * * * * *',
    function() {
        // stopScraper()

        
        // Proxy.aggregate([{ $sample: { size: 1 } }]).then(random => {

        //     // const options = {
        //     //     requestOptions: {
        //     //         host: results[0].metadata.ip,
        //     //         port: parseInt(results[0].metadata.port)
        //     //     }
        //     // };

        //     const options = {
        //         requestOptions: {
        //             host: "41.79.33.14",
        //             port: 5678
        //         }
        //     };
            
        //     youtube.search('PLTR', options).then(results => {
        //         console.log(results.videos); 
        //     });

        // });

        // const options = {
        //     requestOptions: {
        //         proxy: "http://user-cashmachine:Octatrack2$@gate.smartproxy.com:7000",
        //     }
        // };
        
        // youtube.search('PLTR', options).then(results => {
        //     console.log(results); 
        // }).catch((err) => console.log(err));


        // request({
        //         url: 'https://www.youtube.com/results?search_query=pltr',
        //         proxy: 'http://user-cashmachine:Octatrack2$@gate.smartproxy.com:7000',
        //         headers: {
        //             'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Safari/537.36.'
        //         }
        //     })
        //     .then((response) => {console.log(response)})
        //     .catch(console.error);

        // axios
        //     .get('https://www.youtube.com/results?search_query=pltr', {
        //         proxy: {
        //             host: 'gate.smartproxy.com',
        //             port: 10000
        //         }
        //     })
        //     .then((response) => {

        //         if(response.status === 200) {
        //             const html = response.data;
        //             const $ = cheerio.load(html); 
        //             console.log($)
        //         }
            
        //     })
        //     .catch((err) => console.log(err));

            
    },
    null,
    true,
    'America/Los_Angeles'
);

job.start()
loadFirstTicker()


