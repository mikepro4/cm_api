const _ = require("lodash");
const mongoose = require("mongoose");
const User = mongoose.model("user");
const Connection = mongoose.model("connections");
const Wall = mongoose.model("walls");
const Notification = mongoose.model("notifications");
const Post = mongoose.model("posts");
const passport = require('passport');

const requireAuth = passport.authenticate('jwt', { session: false });

module.exports = app => {

	// ===========================================================================

	app.post("/profile", async (req, res) => {
		User.findOne({ username: req.body.username }, async (err, user) => {
			if (user) {
				res.json(user);
			}
		});
	});

	app.post("/connection/create", requireAuth, async (req, res) => {
		const connection = await new Connection({
            createdAt: new Date(),
            object: req.body.object,
			subject: req.body.subject
		}).save();
		res.json(connection);
	});

	app.post("/connection/search",requireAuth,  async (req, res) => {
		const query1 = Connection.findOne({ "object._id": req.body.objectId, "subject._id": req.body.subjectId })

		const query2 = Connection.findOne({ "object._id": req.body.subjectId, "subject._id": req.body.objectId })

		// const query = Video.find(buildQuery(criteria))
		// 	.sort({ [adjustSortProperty]: order })
		// 	.skip(offset)
		// 	.limit(limit);

		return Promise.all(
			[query1, query2]
		).then(
			results => {
				return res.json({
					objectSubject: results[0],
					subjectObject: results[1],
				});
			}
		);
	});

	app.post("/connection/get_followers", async (req, res) => {
		Connection.find({ "subject._id": req.body.objectId}, async (err, results) => {
			if (err) return res.send(err);
			res.json({
				count: results.length
			});
		})
	})

	app.post("/connection/get_following", async (req, res) => {
		Connection.find({ "object._id": req.body.objectId, "subject.symbol": { $exists: false }}, async (err, results) => {
			if (err) return res.send(err);
			res.json({
				count: results.length
			});
		})
    })
    
    app.post("/connection/get_ticker_following", async (req, res) => {
		Connection.find({ "object._id": req.body.objectId, "subject.symbol": { $exists: true }}, async (err, results) => {
			if (err) return res.send(err);
			res.json({
				count: results.length
			});
		})
	})



	app.post("/connection/delete", requireAuth, async (req, res) => {
		Connection.remove({ _id: req.body.connectionId }, async (err) => {
			if (err) return res.send(err);
			res.json({
				success: "true",
				message: "deleted video"
			});
		});
	});

	app.post("/avatar/update", async (req, res) => {
		User.update(
			{
				_id: req.body.userId
			},
			{
				$set: { avatar: req.body.url, avatarDefault: false, avatarGradient: null }
			},
			async (err, info) => {
				if (err) res.status(400).send({ error: "true", error: err });
				if (User) {
					User.findOne({ _id: req.body.userId }, async (err, user) => {
						if (user) {
							res.json(user);
						}
					});
				}
			}
		);
	});

	app.post("/cover/update", async (req, res) => {
		User.update(
			{
				_id: req.body.userId
			},
			{
				$set: { cover: req.body.url, coverGradient: null }
			},
			async (err, info) => {
				if (err) res.status(400).send({ error: "true", error: err });
				if (User) {
					User.findOne({ _id: req.body.userId }, async (err, user) => {
						if (user) {
							res.json(user);
						}
					});
				}
			}
		);
	});

	app.post("/cover/update_cover_gradient", async (req, res) => {
		User.update(
			{
				_id: req.body.userId
			},
			{
				$set: { coverGradient: req.body.gradient, cover: null }
			},
			async (err, info) => {
				if (err) res.status(400).send({ error: "true", error: err });
				if (User) {
					User.findOne({ _id: req.body.userId }, async (err, user) => {
						if (user) {
							res.json(user);
						}
					});
				}
			}
		);
	});

	app.post("/cover/update_avatar_gradient", async (req, res) => {
		User.update(
			{
				_id: req.body.userId
			},
			{
				$set: { avatarGradient: req.body.gradient }
			},
			async (err, info) => {
				if (err) res.status(400).send({ error: "true", error: err });
				if (User) {
					User.findOne({ _id: req.body.userId }, async (err, user) => {
						if (user) {
							res.json(user);
						}
					});
				}
			}
		);
	});

	app.post("/profile/update", async (req, res) => {

		// app.post("/validate_username", async (req, res) => {
			// const { username } = req.body;
			// return User.find(
			// 	{
			// 		"username": { $eq: username.toLowerCase() }
			// 	},
			// 	async (err, result) => {
			// 		if (!_.isEmpty(result)) return res.status(500).send("Already exists");
			// 		res.json({ status: "ok" });
			// 	}
			// );
		// });

		if(req.body.username ==  req.body.originalUsername) {
			User.update(
				{
					_id: req.body.userId
				},
				{
					$set: { 
						bio: req.body.bio,
						url: req.body.url
					}
				},
				async (err, info) => {
					if (err) res.status(400).send({ error: "true", error: err });
					if (User) {
						User.findOne({ _id: req.body.userId }, async (err, user) => {
							if (user) {
								res.json(user);
							}
						});
					}
				}
			);
		} else {

			const { username } = req.body;
			
			User.find(
				{
					"username": { $eq: username.toLowerCase() }
				},
				async (err, result) => {
					if (!_.isEmpty(result))  {
						return res.status(500).send("Already exists") 
					} else {
						User.update(
							{
								_id: req.body.userId
							},
							{
								$set: { 
									username: req.body.username,
									bio: req.body.bio,
									url: req.body.url
								}
							},
							async (err, info) => {
								if (err) res.status(400).send({ error: "true", error: err });
								if (User) {
									User.findOne({ _id: req.body.userId }, async (err, user) => {
										if (user) {
											res.json(user);
										}
									});
								}
							}
						);
					}
						
				}
			);

		}
	});

};

const buildQuery = criteria => {
	const query = {};

	return query
};
