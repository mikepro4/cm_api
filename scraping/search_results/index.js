var CronJob = require('cron').CronJob;
const _ = require("lodash");
const mongoose = require("mongoose");
const request = require('request-promise');

const YoutubeSearch = require("./scrape_yt_search");
const Video = mongoose.model("videos");
const VideoLog = mongoose.model("videologs");
const Ticker = mongoose.model("tickers");
const Proxy = mongoose.model("proxies");
const Channel = mongoose.model("channels");
const ChannelLog = mongoose.model("channellogs");
const Scraping = mongoose.model("scraping");

const keys = require("./../../config/keys");

let io

module.exports = socket => {
    io = socket
}

let scraperStatus = {
    active: null,
    currentTicker: 0,
    currentTickerCount: 0,
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
                        createVideoLog(video, ticker, "add")
                        updateTickerVideoCount(ticker)

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

                        checkIfChannelExists(video.channel, ticker)

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
                                                updateTickerVideoCount(ticker)
                                                createVideoLog(video, ticker, "update")
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
                            // console.log("reject video")

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

function updateTickerVideoCount(ticker) {
    return new Promise(async (resolve, reject) => {
        try {
            Ticker.findOne({ "metadata.symbol": { $eq: ticker} }, async (err, ticker) => {
                if (ticker) {
                    Video.find({
                        "createdAt":{ $gt:new Date(Date.now() - 24*60*60 * 1000)},
                        linkedTickers: {
                            $elemMatch: { symbol: { $eq: ticker.metadata.symbol} }
                        }
                    }, async(err, result) => {
                        if(!result) {
                            resolve()
                        } else {
                            Ticker.update(
                                {
                                    "metadata.symbol": { $eq: ticker.metadata.symbol} 
                                },
                                {
                                    $set: { last24hours: result.length }
                                },
                                async (err, info) => {
                                    if (info) {
                                        // console.log("updated count 24")
                                        resolve(info)
                                    }
                                }
                            );
                        }
                    })

                    Video.find({
                        "createdAt":{ $gt:new Date(Date.now() - 48*60*60 * 1000)},
                        linkedTickers: {
                            $elemMatch: { symbol: { $eq: ticker.metadata.symbol} }
                        }
                    }, async(err, result) => {
                        if(!result) {
                            resolve()
                        } else {
                            Ticker.update(
                                {
                                    "metadata.symbol": { $eq: ticker.metadata.symbol} 
                                },
                                {
                                    $set: { last48hours: result.length }
                                },
                                async (err, info) => {
                                    if (info) {
                                        // console.log("updated count 48")
                                        resolve(info)
                                    }
                                }
                            );
                        }
                    })
                    resolve(ticker)
                }
            });
        }catch (e) {
            reject(e);
        }
        
    })
}

/////////////////////////////////////////

function checkIfChannelExists(channel, ticker) {
    return new Promise(async (resolve, reject) => {
        try {
            Channel.findOne(
                {
                    "metadata.link": { $eq: channel.link }
                },
                async(err, result) => {
                    if(!result) {
                        createChannel(channel, ticker)
                        resolve()
                    } else {
                        linkToChannel(channel, ticker)
                        resolve(result)
                    }
                }
            )
        }catch (e) {
            reject(e);
        }
        
    })
}

/////////////////////////////////////////

function createChannel(channel, ticker) {
    return new Promise(async (resolve, reject) => {
        try {
            const newChannel = await new Channel({
                createdAt: new Date(),
                linkedTickers: [
                    {
                        symbol: ticker
                    }
                ],
                metadata: channel
            }).save();

            if(newChannel) {
                // console.log("add channel")
                createChannelLog(newChannel, ticker, "add")
                io.emit('channelUpdate',{
                    status: "add channel",
                    channel: newChannel
                })
                resolve(newChannel)
            }
        }catch (e) {
            reject(e);
        }
        
    })
}

/////////////////////////////////////////

function linkToChannel(channel, ticker) {
    return new Promise(async (resolve, reject) => {
        try {
            Channel.findOne(
                {
                    "metadata.link": { $eq: channel.link }
                },
                async(err, result) => {
                    if(!result) {
                        return 
                    } else {
                        let linked = _.find(result.linkedTickers, { symbol: ticker})

                        if (!linked) {

                            let newLinked = [
                                ...result.linkedTickers,
                                {
                                    symbol: ticker
                                }
                            ]

                            Channel.update(
                                {
                                    _id: result._id
                                },
                                {
                                    $set: { linkedTickers: newLinked }
                                },
                                async (err, info) => {
                                    if (info) {

                                        Channel.findOne({ _id: result._id }, async (err, channel) => {
                                            if (channel) {
                                                // console.log("update channel")
                                                createChannelLog(channel, ticker, "update")
                                                io.emit('channelUpdate',{
                                                    status: "update",
                                                    ticker: ticker,
                                                    channel: channel
                                                })
                                                resolve(channel)
                                            }
                                        });
                                    }
                                }
                            );
                        } else {
                            // console.log("reject channel")
                            
                        }
                        
                    }
                }
            )
           
        }catch (e) {
            reject(e);
        }
        
    })
}

/////////////////////////////////////////

function createChannelLog(channel, ticker, type) {
    return new Promise(async (resolve, reject) => {
        try {
            const newChannelLog = await new ChannelLog({
                createdAt: new Date(),
                metadata: {
                    type: type,
                    channelLink: channel.metadata.link,
                    channelName: channel.metadata.name,
                    channelId: channel._id,
                    symbol: ticker
                }
            }).save();

            if(newChannelLog) {
                resolve(newChannelLog)
            }
           
        }catch (e) {
            reject(e);
        }
        
    })
}

function createVideoLog(video, ticker, type) {
    return new Promise(async (resolve, reject) => {
        try {
            const newVideoLog = await new VideoLog({
                createdAt: new Date(),
                metadata: {
                    type: type,
                    symbol: ticker,
                    video: video
                }
            }).save();

            if(newVideoLog) {
                resolve(newVideoLog)
            }
           
        }catch (e) {
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

/////////////////////////////////////////

loadFirstTickerCount = async (req, res) => {
    const query = Ticker.find()
            .sort({ "metadata.symbol": "1" })
            .skip(0)
            .limit(1);
            
    return Promise.all(
        [query, Ticker.find().countDocuments()]
    ).then(
        results => {
            let symbol = results[0]
            scraperStatus.currentTickerCount = 0
            tickerCount = results[1]

            let finalSymbol = symbol[0].metadata.symbol


            if(symbol[0] && symbol[0].metadata) {
                setTimeout(() => {

                    updateTickerVideoCount(finalSymbol)
                    loadNextTickerCount()
                }, 1000)
                
            }

            
        }
    );
}

/////////////////////////////////////////

loadNextTickerCount = async (req, res) => {
    scraperStatus.currentTickerCount = scraperStatus.currentTickerCount + 1

    const query = Ticker.find()
            .sort({ "metadata.symbol": "1" })
            .skip(scraperStatus.currentTickerCount)
            .limit(1);
            
    return Promise.all(
        [query, Ticker.find().countDocuments()]
    ).then(
        results => {
            let symbol = results[0]

            if(symbol[0].metadata) {
                updateTickerVideoCount(symbol[0].metadata.symbol)

                setTimeout(() => {
                    if(scraperStatus.currentTickerCount < results[1] -1) {
                        loadNextTickerCount()
                    } else{
                        scraperStatus.currentTickerCount = 0
                    }
                }, 1000)
            }
        }
    );
}


var job = new CronJob(
    '0 * * * *',
    function() {
        console.log("run cron count")
        loadFirstTickerCount()
    },
    null,
    true,
    'America/Los_Angeles'
);

job.start()