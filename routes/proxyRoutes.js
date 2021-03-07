const _ = require("lodash");
const mongoose = require("mongoose");
const Proxy = mongoose.model("proxies");
const request = require('request-promise');

module.exports = app => {

	// ===========================================================================

	app.post("/proxies/search", async (req, res) => {
		const { criteria, sortProperty, offset, limit, order } = req.body;
		let adjustSortProperty 
		if (sortProperty == "createdAt") {
			adjustSortProperty = sortProperty
		} else {
			adjustSortProperty = "metadata." + sortProperty
		}
		const query = Proxy.find(buildQuery(criteria))
			.sort({ [adjustSortProperty]: order })
			.skip(offset)
			.limit(limit);

		return Promise.all(
			[query, Proxy.find(buildQuery(criteria)).countDocuments()]
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

	app.post("/proxies/create", async (req, res) => {
		const proxy = await new Proxy({
			createdAt: new Date(),
			metadata: req.body.metadata,
		}).save();
		res.json(proxy);
	});

	// ===========================================================================

	app.post("/proxies/update", async (req, res) => {
		Proxy.update(
			{
				_id: req.body.proxyId
			},
			{
				$set: { metadata: req.body.newProxy }
			},
			async (err, info) => {
				if (err) res.status(400).send({ error: "true", error: err });
				if (info) {
					Proxy.findOne({ _id: req.body.proxyId }, async (err, proxy) => {
						if (proxy) {
							res.json({ success: "true", info: info, proxy: proxy });
						}
					});
				}
			}
		);
	});

	// ===========================================================================

	app.post("/proxies/delete", async (req, res) => {
		Proxy.remove({ _id: req.body.proxyId }, async (err) => {
			if (err) return res.send(err);
			res.json({
				success: "true",
				message: "deleted proxy"
			});
		});
	});

	// ===========================================================================

	app.post("/proxies/details", async (req, res) => {
		Proxy.findOne({ _id: req.body.proxyId }, async (err, proxy) => {
			if (proxy) {
				res.json(proxy);
			}
		});
	});

	// ===========================================================================

	app.post("/proxies/validate_ip", async (req, res) => {
		const { ip } = req.body;
		Proxy.findOne(
			{
				"metadata.ip": { $eq: ip }
			},
			async (err, result) => {
				if (!_.isEmpty(result)) return res.status(500).send("Already exists");
				res.json({ status: "ok" });
			}
		);
	});

	// ===========================================================================

	app.post("/proxies/test", async (req, res) => {
		return new Promise((resolve, reject) => {
			request({
				url: "https://www.youtube.com/results?search_query=pltr&sp=CAISAhAB",
				proxy: "http://" + req.body.proxy,
				headers: {
					'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Safari/537.36.'
				}
			})
			.then((response, err) => {
				res.json({ working: true, response: response });
			})
			.catch((err) => {
				if(err.statusCode == 429) {
					res.json({ working: false, banned: true });
				} else {
					console.log(err)
					res.json({ working: false, error: err})
				}
			})
		});
	});

	// ===========================================================================

	app.post("/proxies/update_banned", async (req, res) => {
		Proxy.update(
			{
				_id: req.body.proxyId
			},
			{
				$set: { banned: req.body.banned }
			},
			async (err, info) => {
				if (err) res.status(400).send({ error: "true", error: err });
				if (info) {
					Proxy.findOne({ _id: req.body.proxyId }, async (err, proxy) => {
						if (proxy) {
							res.json({ success: "true", info: info, proxy: proxy });
						}
					});
				}
			}
		);
	});

	// ===========================================================================

	app.post("/proxies/update_working", async (req, res) => {
		Proxy.update(
			{
				_id: req.body.proxyId
			},
			{
				$set: { banned: req.body.working }
			},
			async (err, info) => {
				if (err) res.status(400).send({ error: "true", error: err });
				if (info) {
					Proxy.findOne({ _id: req.body.proxyId }, async (err, proxy) => {
						if (proxy) {
							res.json({ success: "true", info: info, proxy: proxy });
						}
					});
				}
			}
		);
	});

};

const buildQuery = criteria => {
	const query = {};

	if (criteria.ip) {
		_.assign(query, {
			"metadata.ip": {
				$regex: new RegExp(criteria.ip),
				$options: "i"
			}
		});
	}

	if (criteria.source) {
		_.assign(query, {
			"metadata.source": {
				$regex: new RegExp(criteria.source),
				$options: "i"
			}
		});
	}

	return query
};
