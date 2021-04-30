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

    app.post("/connections/followers", async (req, res) => {
        // const query1 = Connection.findOne({ "object._id": req.body.objectId, "subject._id": req.body.subjectId })

        const { criteria, sortProperty, offset, limit, order } = req.body;
        
		const query = Connection.find(buildQuery(criteria))
			.sort({ [sortProperty]: order })
			.skip(offset)
			.limit(limit);

		return Promise.all(
			[query, Connection.find(buildQuery(criteria)).countDocuments()]
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

    app.post("/connections/following", async (req, res) => {
        // const query1 = Connection.findOne({ "object._id": req.body.objectId, "subject._id": req.body.subjectId })
        const { criteria, sortProperty, offset, limit, order } = req.body;
        console.log(criteria)

        
		const query = Connection.find(buildQueryFollowing(criteria))
			.sort({ [sortProperty]: order })
			.skip(offset)
			.limit(limit);

		return Promise.all(
			[query, Connection.find(buildQueryFollowing(criteria)).countDocuments()]
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

};

const buildQuery = criteria => {
	const query = {};

	if (criteria.userId) {
		_.assign(query, {
			"subject._id": {$eq: criteria.userId}
		});
    }
    
    if (criteria.symbol) {
        _.assign(query, {
            "subject.symbol": {$eq: criteria.symbol}
		});
    }

	return query
};

const buildQueryFollowing = criteria => {
	const query = {};

	if (criteria.userId && criteria.userTickers) {
        _.assign(query, {
            "object._id": {$eq: criteria.userId},
            "subject.symbol": { $exists: true }
        });
    }

    if (criteria.userId && !criteria.userTickers) {
        _.assign(query, {
            "object._id": {$eq: criteria.userId},
            "subject.symbol": { $exists: false }
        });
    }
    
    if (criteria.symbol) {
        _.assign(query, {
            "subject.symbol": {$eq: criteria.symbol}
		});
    }

	return query
};

