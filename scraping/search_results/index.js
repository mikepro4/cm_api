var CronJob = require('cron').CronJob;
const _ = require("lodash");
const mongoose = require("mongoose");
const request = require('request-promise');

const YoutubeSearch = require("./scrape_yt_search");
const Video = mongoose.model("videos");
const Ticker = mongoose.model("tickers");
const Proxy = mongoose.model("proxies");
const Scraping = mongoose.model("scraping");

const keys = require("./../../config/keys");

let io

module.exports = socket => {
    io = socket
}

let scraperStatus = {
    active: null,
    currentTicker: 0,
    tickerCount: 0,
    pausedTicker: null,
    currentCycle: {
        cycleStartTime: null,
        videosAdds: 0,
        videosUpdates: 0,
        videoDeletes: 0,
        proxyErrors: 0
    },
    previousCycle: null,
    useSmartproxy: false,
    sorting: "CAISBAgCEAE"
}

module.exports.start = () => {
    scraperStatus.active = true
    loadFirstTicker()
}

module.exports.stop = () => {
    scraperStatus.active = false
}

// Initial start

function initialSetup() {
    return new Promise(async (resolve, reject) => {
        try {
            Scraping.findOne({}, async (err, scraping) => {
                if (scraping) {
                    scraperStatus.active = scraping.scrapingSearchActive

                    if(scraperStatus.active) {
                        loadFirstTicker()
                    }

                    resolve(scraping)
                }
            });
        } catch (e) {
            reject(e)
        }
    })
}

initialSetup()

/////////////////////////////////////////

function searchVideos(ticker) {
    return Proxy.aggregate([{ $sample: { size: 1 } }]).then(random => {

        let proxy = "http://" + random[0].metadata.ip

        if(scraperStatus.useSmartproxy) {
            proxy =  keys.sp
        }

        io.emit('tickerUpdate', {
            ticker: ticker,
            proxy: proxy
        })

        YoutubeSearch
            .search(
                ticker, 
                {sp: scraperStatus.sorting },
                proxy,
                io
            )
            .then(results => {
                results.videos.map((result) => {
                return checkVideo(result, ticker)
            })
        }).catch((err) => console.log(err));
    });
}

/////////////////////////////////////////

function checkVideo(video, ticker) {
    return new Promise(async (resolve, reject) => {
        try {
            Video.findOne(
                {
                    googleId: { $eq: video.id }
                },
                async(err, result) => {
                    if(!result) {
                        console.log("add video")

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
                            io.emit('videoUpdate',{
                                status: "add",
                                ticker: ticker,
                                video: newVideo
                            })
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
                                                console.log("update video")
                                                io.emit('videoUpdate',{
                                                    status: "update",
                                                    ticker: ticker,
                                                    video: video
                                                })
                                                resolve(video)
                                            }
                                        });
                                    }
                                }
                            );
                        } else {
                            console.log("reject video")

                            // io.emit('videoUpdate', {
                            //     status: "reject",
                            //     ticker: ticker,
                            //     video: result
                            // })
                            
                        }
                    }
                }
            );


        } catch (e) {
            reject(e);
        }
        
    })
}

/////////////////////////////////////////


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
            scraperStatus.currentTicker = 0
            tickerCount = results[1]

            let finalSymbol = symbol[0].metadata.symbol


            if(symbol[0] && symbol[0].metadata) {
                setTimeout(() => {

                    searchVideos(finalSymbol)

                    if(scraperStatus.active) {
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

/////////////////////////////////////////

loadNextTicker = async (req, res) => {
    scraperStatus.currentTicker = scraperStatus.currentTicker + 1

    const query = Ticker.find()
            .sort({ "metadata.symbol": "1" })
            .skip(scraperStatus.currentTicker)
            .limit(1);
            
    return Promise.all(
        [query, Ticker.find().countDocuments()]
    ).then(
        results => {
            let symbol = results[0]

            if(symbol[0].metadata) {
                searchVideos(symbol[0].metadata.symbol)

                setTimeout(() => {
                    if(scraperStatus.currentTicker < results[1] -1) {
                        if(scraperStatus.active) {
                            loadNextTicker()
                        }
                    } else{
                        scraperStatus.currentTicker = 0
                        setTimeout(() => {
                            if(scraperStatus.active) {
                                loadFirstTicker()
                            }
                        }, 100000)
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
