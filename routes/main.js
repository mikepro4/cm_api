const passport = require('passport');
const requireAuth = passport.authenticate('jwt', { session: false });

const mongoose = require("mongoose");
const Proxy = mongoose.model("proxies");
const Ticker = mongoose.model("tickers");
const Video = mongoose.model("videos");

module.exports = app => {
	app.get(
        "/user_details",
        requireAuth,
		(req, res) => {
            res.send(req.user)
		}
	);

	// ===========================================================================

	app.get("/collections/counts", async (req, res) => {
		const { criteria, sortProperty, offset, limit, order } = req.body;
		let adjustSortProperty 
		if (sortProperty == "createdAt") {
			adjustSortProperty = sortProperty
		} else {
			adjustSortProperty = "metadata." + sortProperty
		}
		const queryProxies = Proxy.find(buildQuery(criteria))
			.sort({ [adjustSortProperty]: order })
			.skip(offset)
			.limit(limit);

		const queryTickers = Ticker.find(buildQuery(criteria))
			.sort({ [adjustSortProperty]: order })
			.skip(offset)
			.limit(limit);
			
		const queryVideos = Video.find(buildQuery(criteria))
			.sort({ [adjustSortProperty]: order })
			.skip(offset)
			.limit(limit);

		return Promise.all(
			[queryProxies.countDocuments(), queryTickers.countDocuments(), queryVideos.countDocuments()]
		).then(
			results => {
				return res.json({
					proxies: results[0],
					tickers: results[1],
					videos: results[2],
				});
			}
		);
	});
};

const buildQuery = criteria => {
	const query = {};

	return query
};


