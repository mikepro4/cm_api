var CronJob = require('cron').CronJob;
const _ = require("lodash");
const mongoose = require("mongoose");
const request = require('request-promise');

const Video = mongoose.model("videos");
const VideoLog = mongoose.model("videologs");
const Ticker = mongoose.model("tickers");
const Proxy = mongoose.model("proxies");
const Channel = mongoose.model("channels");
const ChannelLog = mongoose.model("channellogs");
const Scraping = mongoose.model("scraping");
const Connection = mongoose.model("connections");
const Wall = mongoose.model("walls");
const Notification = mongoose.model("notifications");

const keys = require("./../../config/keys");

module.exports.newWallItem = (userId, contentType, contentId, linkedTickers, linkedUsers, user ) => {
    updateFollowers(userId, contentType, contentId)
    updateTickers(userId, contentType, contentId, linkedTickers)
    updateUsers(userId, contentType, contentId, linkedUsers, user)
}

function updateFollowers(userId, contentType, contentId, ) {
    return new Promise(async (resolve, reject) => {
        try {
            Connection.find(
                { 
                    "subject._id": userId
                },
                { 
                    "subject._id.$": 1 
                }, async (err, results) => {

                   _.map(results, async (result) => {

                        const wallItem = await new Wall({
                            createdAt: new Date(),
                            userId: result.subject._id,
                            contentType: contentType,
                            context: "user",
                            contentId: contentId
                        }).save();
                        
                        if(wallItem) {
                            console.log(wallItem)
                        }
                   })
                }
            )
        } catch (e) {
            reject(e);
        }
    })
}

function updateTickers(userId, contentType, contentId, linkedTickers) {
    return new Promise(async (resolve, reject) => {
        try {
            _.map(linkedTickers, async (result) => {

                const wallItem = await new Wall({
                    createdAt: new Date(),
                    symbol: result,
                    contentType: contentType,
                    context: "ticker",
                    contentId: contentId
                }).save();
                
                if(wallItem) {
                    console.log(wallItem)
                }
            })
        } catch (e) {
            reject(e);
        }
    })
}


function updateUsers(userId, contentType, contentId, linkedUsers, user) {
    return new Promise(async (resolve, reject) => {
        try {
            _.map(linkedUsers, async (result) => {

                const wallItem = await new Notification({
                    createdAt: new Date(),
                    user: user,
                    type: "post-mention",
                    relatedContentType: contentType,
                    relatedContentId: contentId
                }).save();
                
                if(wallItem) {
                    console.log(wallItem)
                }
            })
        } catch (e) {
            reject(e);
        }
    })
}