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

const { v4: uuidv4 } = require('uuid');

const _ = require("lodash");

const { newWallItem } = require("./controllers/wallController")

module.exports = app => {

    app.post("/posts/create", requireAuth, async (req, res) => {
        let newUser = {
            "_id": req.body.user._id,
            avatar: req.body.user.avatar,
            avatarDefault: req.body.user.avatarDefault,
            avatarGradient: req.body.user.avatarGradient,
            username: req.body.user.username
        }
		const connection = await new Post({
            createdAt: new Date(),
            content: req.body.content,
            user: newUser,
            linkedTickers: req.body.linkedTickers,
            linkedUsers: req.body.linkedUsers,
            sentiment: req.body.sentiment,
            clientWidth: req.body.clientWidth
        }).save();
        if(connection) {

            Post.findOne({ "user._id": req.body.user._id}, async (err, post) => {
                if (post) {
                    newWallItem(
                        req.body.user._id, 
                        "post", 
                        post._id,
                        req.body.linkedTickers,
                        req.body.linkedUsers,
                        newUser
                    )
                }
            });
        }
		res.json(connection);
    });

    // ===========================================================================

    
    app.post("/posts/item", async (req, res) => {
		Post.findOne({ "user._id": req.body.userId }, async (err, post) => {
			if (post) {
				res.json(post);
			}
		});
    });


    // ===========================================================================

    
    app.post("/posts/search", async (req, res) => {
        const { criteria, sortProperty, offset, limit, order } = req.body;
        
		const query = Post.find(buildQuery(criteria))
			.sort({ [sortProperty]: order })
			.skip(offset)
			.limit(limit);

		return Promise.all(
			[query, Post.find(buildQuery(criteria)).countDocuments()]
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

    
    // ===========================================================================

	app.post("/posts/delete", async (req, res) => {
        if(req.user._id == req.body.post.user._id) {
            Post.remove({ _id: req.body.postId }, async (err) => {
                if (err) return res.send(err);
                res.json({
                    success: "true",
                    message: "deleted post"
                });
            });
        } else {
            res.json({
                message: "You are not the owner. Don't even fucking try."
            });
        }
    });
    
    // ===========================================================================

    app.post("/posts/update", async (req, res) => {
		Post.update(
			{
				_id: req.body.postId
			},
			{
				$set: { 
                    content: req.body.content,
                    linkedTickers: req.body.linkedTickers,
                    linkedUsers: req.body.linkedUsers
                }
			},
			async (err, info) => {
				if (err) res.status(400).send({ error: "true", error: err });
				if (Post) {
					Post.findOne({ _id: req.body.postId }, async (err, post) => {
						if (user) {
							res.json(user);
						}
					});
				}
			}
		);
	});
	
};

const buildQuery = criteria => {
	const query = {};

	if (criteria.userId) {
		_.assign(query, {
			"user._id": {
				$regex: new RegExp(criteria.userId),
				$options: "i"
			}
		});
	}

	return query
};

