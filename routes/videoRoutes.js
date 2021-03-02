const _ = require("lodash");
const mongoose = require("mongoose");
const Video = mongoose.model("videos");

module.exports = app => {

	// ===========================================================================

	app.post("/videos/search", async (req, res) => {
		const { criteria, sortProperty, offset, limit, order } = req.body;
		let adjustSortProperty 
		if (sortProperty == "createdAt") {
			adjustSortProperty = sortProperty
		} else {
			adjustSortProperty = "metadata." + sortProperty
		}
		const query = Video.find(buildQuery(criteria))
			.sort({ [adjustSortProperty]: order })
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

	// ===========================================================================

	app.post("/videos/create", async (req, res) => {
		const video = await new Video({
            createdAt: new Date(),
            googleId: req.body.metadata.id,
			metadata: req.body.metadata,
		}).save();
		res.json(video);
	});

	// ===========================================================================

	app.post("/videos/update", async (req, res) => {
		Video.update(
			{
				_id: req.body.videoId
			},
			{
				$set: { metadata: req.body.newVideo }
			},
			async (err, info) => {
				if (err) res.status(400).send({ error: "true", error: err });
				if (info) {
					Video.findOne({ _id: req.body.videoId }, async (err, video) => {
						if (video) {
							res.json({ success: "true", info: info, video: video });
						}
					});
				}
			}
		);
	});

	// ===========================================================================

	app.post("/videos/delete", async (req, res) => {
		Video.remove({ _id: req.body.videoId }, async (err) => {
			if (err) return res.send(err);
			res.json({
				success: "true",
				message: "deleted video"
			});
		});
	});

	// ===========================================================================

	app.post("/videos/details", async (req, res) => {
		Video.findOne({ _id: req.body.videoId }, async (err, video) => {
			if (video) {
				res.json(video);
			}
		});
	});

	// ===========================================================================

	app.post("/videos/validate_googleId", async (req, res) => {
		const { googleId } = req.body;
		Video.findOne(
			{
				googleId: { $eq: googleId }
			},
			async (err, result) => {
				if (!_.isEmpty(result)) return res.status(500).send("Already exists");
				res.json({ status: "ok" });
			}
		);
	});
};

const buildQuery = criteria => {
	const query = {};

	return query
};
