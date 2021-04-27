const passport = require('passport');
const keys = require("../config/keys");
const requireAuth = passport.authenticate('jwt', { session: false });

const mongoose = require("mongoose");
const Proxy = mongoose.model("proxies");
const Ticker = mongoose.model("tickers");
const Video = mongoose.model("videos");
const Channel = mongoose.model("channels");
const Group = mongoose.model("groups");
const User = mongoose.model("user");
const Post = mongoose.model("posts");
const Connection = mongoose.model("connections");

const { v4: uuidv4 } = require('uuid');

const _ = require("lodash");

module.exports = app => {
    app.post("/public/videos/search", async (req, res) => {
        const { criteria, sortProperty, offset, limit, order } = req.body;
        
        const query = Video.find(buildQuery(criteria))
            .sort({ [sortProperty]: order })
            .skip(offset)
            .limit(limit);

        return Promise.all(
            [query, Video.find(buildQuery(criteria)).countDocuments()]
        ).then(
            results => {
                return res.json({
                    all: results[0],
                    count: results[1],
                    offset: offset,
                    limit: limit
                });
            }
        );
    });
}

const buildQuery = criteria => {
	const query = {};

	if (criteria && criteria.symbol) {
        _.assign(query, {
            linkedTickers: {
                $elemMatch: { symbol: { $eq: criteria.symbol } }
            }
        });
	}

	return query
};


