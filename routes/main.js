const passport = require('passport');
const requireAuth = passport.authenticate('jwt', { session: false });

const mongoose = require("mongoose");
const Proxy = mongoose.model("proxies");
const Ticker = mongoose.model("tickers");
const Video = mongoose.model("videos");
const Channel = mongoose.model("channels");
const Group = mongoose.model("groups");

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
		
		const queryChannels = Channel.find(buildQuery(criteria))
			.sort({ [adjustSortProperty]: order })
			.skip(offset)
			.limit(limit);

		const queryGroups = Group.find(buildQuery(criteria))
			.sort({ [adjustSortProperty]: order })
			.skip(offset)
			.limit(limit);

		return Promise.all(
			[
				queryProxies.countDocuments(), 
				queryTickers.countDocuments(), 
				queryVideos.countDocuments(),
				queryChannels.countDocuments(),
				queryGroups.countDocuments()
			]
		).then(
			results => {
				return res.json({
					proxies: results[0],
					tickers: results[1],
					videos: results[2],
					channels: results[3],
					groups: results[4]
				});
			}
		);
	});
};

const buildQuery = criteria => {
	const query = {};

	return query
};


