const _ = require("lodash");
const mongoose = require("mongoose");
const ProxyLog = mongoose.model("proxylogs");

module.exports = app => {

	// ===========================================================================

	app.post("/proxyLogs/search", async (req, res) => {
		const { criteria, sortProperty, offset, limit, order } = req.body;
		let adjustSortProperty 
		if (sortProperty == "createdAt") {
			adjustSortProperty = sortProperty
		} else {
			adjustSortProperty = "metadata." + sortProperty
		}
		const query = ProxyLog.find(buildQuery(criteria))
			.sort({ [adjustSortProperty]: order })
			.skip(offset)
			.limit(limit);

		return Promise.all(
			[query, ProxyLog.find(buildQuery(criteria)).countDocuments()]
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

	app.post("/proxyLogs/create", async (req, res) => {
		const proxyLog = await new ProxyLog({
			createdAt: new Date(),
			metadata: req.body.metadata,
		}).save();
		res.json(proxyLog);
	});

	// ===========================================================================

	app.post("/proxyLogs/details", async (req, res) => {
		ProxyLog.findOne({ _id: req.body.proxyLogId }, async (err, proxyLog) => {
			if (proxyLog) {
				res.json(proxyLog);
			}
		});
	});
};

const buildQuery = criteria => {
	const query = {};

	return query
};
