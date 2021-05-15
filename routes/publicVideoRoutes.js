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

    app.post("/public/video/disable", async (req, res) => {
		Video.update(
			{
				"metadata.id": req.body.videoId
			},
			{
				$set: { disabled: true }
			},
			async (err, info) => {
				if (err) res.status(400).send({ error: "true", error: err });
				if (info) {
					Video.findOne({ "metadata.id": req.body.videoId }, async (err, video) => {
						if (video) {
							res.json({ success: "true", info: info, video: video });
						}
					});
				}
			}
		);
	});

    app.post("/public/videos/item", async (req, res) => {
		Video.findOne({ "googleId": req.body.googleId }, async (err, video) => {
			if (video) {
				res.json(video);
			}
		});
	});
}

const buildQuery = criteria => {
	const query = {};

	if (criteria && criteria.symbol) {
        _.assign(query, {
            linkedTickers: {
                $elemMatch: { symbol: { $eq: criteria.symbol } }
            },
            approvedFor: {
                $elemMatch: { symbol: { $eq: criteria.symbol } }
            },
            disabled: {
                $ne: true
            }
        });


	}

	return query
};


