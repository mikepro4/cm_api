const _ = require("lodash");
const mongoose = require("mongoose");
const ChannelLog = mongoose.model("channellogs");

module.exports = app => {

	// ===========================================================================

	app.post("/channelLogs/search", async (req, res) => {
		const { criteria, sortProperty, offset, limit, order } = req.body;
		let adjustSortProperty 
		if (sortProperty == "createdAt") {
			adjustSortProperty = sortProperty
		} else {
			adjustSortProperty = "metadata." + sortProperty
		}
		const query = ChannelLog.find(buildQuery(criteria))
			.sort({ [adjustSortProperty]: order })
			.skip(offset)
			.limit(limit);

		return Promise.all(
			[query, ChannelLog.find(buildQuery(criteria)).countDocuments()]
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

	app.post("/channelLogs/create", async (req, res) => {
		const channelLog = await new ChannelLog({
			createdAt: new Date(),
			metadata: req.body.metadata,
		}).save();
		res.json(channelLog);
	});

	// ===========================================================================

	app.post("/channelLogs/delete", async (req, res) => {
		ChannelLog.remove({ _id: req.body.channelLogId }, async (err) => {
			if (err) return res.send(err);
			res.json({
				success: "true",
				message: "deleted channelLog"
			});
		});
	});

	// ===========================================================================

	app.post("/channelLogs/details", async (req, res) => {
		ChannelLog.findOne({ _id: req.body.channelLogId }, async (err, channelLog) => {
			if (channelLog) {
				res.json(channelLog);
			}
		});
	});
};

const buildQuery = criteria => {
	const query = {};

	return query
};
