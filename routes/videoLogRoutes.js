const _ = require("lodash");
const mongoose = require("mongoose");
const VideoLog = mongoose.model("videologs");

module.exports = app => {

	// ===========================================================================

	app.post("/videoLogs/search", async (req, res) => {
		const { criteria, sortProperty, offset, limit, order } = req.body;
		let adjustSortProperty 
		if (sortProperty == "createdAt") {
			adjustSortProperty = sortProperty
		} else {
			adjustSortProperty = "metadata." + sortProperty
		}
		const query = VideoLog.find(buildQuery(criteria))
			.sort({ [adjustSortProperty]: order })
			.skip(offset)
			.limit(limit);

		return Promise.all(
			[query, VideoLog.find(buildQuery(criteria)).countDocuments()]
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

	app.post("/videoLogs/create", async (req, res) => {
		const videoLog = await new VideoLog({
			createdAt: new Date(),
			metadata: req.body.metadata,
		}).save();
		res.json(videoLog);
	});

	// ===========================================================================

	app.post("/videoLogs/details", async (req, res) => {
		VideoLog.findOne({ _id: req.body.videoLogId }, async (err, videoLog) => {
			if (videoLog) {
				res.json(videoLog);
			}
		});
	});
};

const buildQuery = criteria => {
	const query = {};

	return query
};
