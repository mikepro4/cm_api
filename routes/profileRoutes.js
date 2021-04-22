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

	app.post("/connection/create", async (req, res) => {
		const connection = await new Connection({
            createdAt: new Date(),
            object: req.body.object,
			subject: req.body.subject
		}).save();
		res.json(connection);
	});

	app.post("/connection/search", async (req, res) => {
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
		Connection.findAll({ "subject._id": req.body.objectId}, async (err, results) => {
			if (err) return res.send(err);
			res.json({
				count: results.count()
			});
		})
	})

	app.post("/connection/get_following", async (req, res) => {
		Connection.findAll({ "object._id": req.body.objectId}, async (err, results) => {
			if (err) return res.send(err);
			res.json({
				count: results.count()
			});
		})
	})



	app.post("/connection/delete", async (req, res) => {
		Connection.remove({ _id: req.body.connectionId }, async (err) => {
			if (err) return res.send(err);
			res.json({
				success: "true",
				message: "deleted video"
			});
		});
	});

};

const buildQuery = criteria => {
	const query = {};

	return query
};
