const _ = require("lodash");
const mongoose = require("mongoose");
const Channel = mongoose.model("channels");

module.exports = app => {

	// ===========================================================================

	app.post("/channels/search", async (req, res) => {
		const { criteria, sortProperty, offset, limit, order } = req.body;
		let adjustSortProperty 
		if (sortProperty == "createdAt") {
			adjustSortProperty = sortProperty
		} else {
			adjustSortProperty = "metadata." + sortProperty
		}
		const query = Channel.find(buildQuery(criteria))
			.sort({ [adjustSortProperty]: order })
			.skip(offset)
			.limit(limit);

		return Promise.all(
			[query, Channel.find(buildQuery(criteria)).countDocuments()]
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

	app.post("/channels/create", async (req, res) => {
        const { link } = req.body.metadata;
        
		Channel.findOne(
			{
				"metadata.link": { $eq: link }
			},
			async (err, result) => {
				if (!_.isEmpty(result))  {
                    return res.status(500).send("Already exists")
                } else {
                    const channel = await new Channel({
                        createdAt: new Date(),
                        metadata: req.body.metadata,
                        videosCount: 1,
                        linkedTickers: [
                            {
                                symbol: req.body.symbol
                            }
                        ]
                    }).save();
                    res.json(channel);
                }
			}
        );
	});

	// ===========================================================================

	app.post("/channels/update", async (req, res) => {
		Channel.update(
			{
				_id: req.body.channelId
			},
			{
				$set: { metadata: req.body.newChannel }
			},
			async (err, info) => {
				if (err) res.status(400).send({ error: "true", error: err });
				if (info) {
					Channel.findOne({ _id: req.body.channelId }, async (err, channel) => {
						if (channel) {
							res.json({ success: "true", info: info, channel: channel });
						}
					});
				}
			}
		);
	});

	// ===========================================================================

	app.post("/channels/delete", async (req, res) => {
		Channel.remove({ _id: req.body.channelId }, async (err) => {
			if (err) return res.send(err);
			res.json({
				success: "true",
				message: "deleted channel"
			});
		});
	});

	// ===========================================================================

	app.post("/channels/details", async (req, res) => {
		Channel.findOne({ _id: req.body.channelId }, async (err, channel) => {
			if (channel) {
				res.json(channel);
			}
		});
	});

	// ===========================================================================

	app.post("/channels/validate_channelUrl", async (req, res) => {
		const { link } = req.body.metadata;
		Channel.findOne(
			{
				"metadata.link": { $eq: link }
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
