const _ = require("lodash");
const mongoose = require("mongoose");
const Ticker = mongoose.model("tickers");

module.exports = app => {

	// ===========================================================================

	app.post("/tickers/search", async (req, res) => {
		const { criteria, sortProperty, offset, limit, order } = req.body;
		let adjustSortProperty 
		if (sortProperty == "createdAt") {
			adjustSortProperty = sortProperty
		} else if (sortProperty == "last24hours") {
			adjustSortProperty = sortProperty
		} else {
			adjustSortProperty = "metadata." + sortProperty
		}
		const query = Ticker.find(buildQuery(criteria))
			.sort({[adjustSortProperty]: order, "_id": 1})
			.skip(offset)
			.limit(limit);

		return Promise.all(
			[query, Ticker.find(buildQuery(criteria)).countDocuments()]
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

	app.post("/tickers/create", async (req, res) => {
		const ticker = await new Ticker({
			createdAt: new Date(),
			metadata: req.body.metadata,
		}).save();
		res.json(ticker);
	});

	// ===========================================================================

	app.post("/tickers/update", async (req, res) => {
		Ticker.update(
			{
				_id: req.body.tickerId
			},
			{
				$set: { metadata: req.body.newTicker }
			},
			async (err, info) => {
				if (err) res.status(400).send({ error: "true", error: err });
				if (info) {
					Ticker.findOne({ _id: req.body.tickerId }, async (err, ticker) => {
						if (ticker) {
							res.json({ success: "true", info: info, ticker: ticker });
						}
					});
				}
			}
		);
	});

	// ===========================================================================

	app.post("/tickers/delete", async (req, res) => {
		Ticker.remove({ _id: req.body.tickerId }, async (err) => {
			if (err) return res.send(err);
			res.json({
				success: "true",
				message: "deleted ticker"
			});
		});
	});

	// ===========================================================================

	app.post("/tickers/details", async (req, res) => {
		Ticker.findOne({ _id: req.body.tickerId }, async (err, ticker) => {
			if (ticker) {
				res.json(ticker);
			}
		});
	});

	// ===========================================================================

	app.post("/tickers/validate_symbol", async (req, res) => {
		const { symbol } = req.body;
		Ticker.findOne(
			{
				"metadata.symbol": { $eq: symbol }
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

	if (criteria.symbol) {
		_.assign(query, {
			"metadata.symbol": {
				$regex: new RegExp(criteria.symbol),
				$options: "i"
			}
		});
	}

	if (criteria.name) {
		_.assign(query, {
			"metadata.name": {
				$regex: new RegExp(criteria.name),
				$options: "i"
			}
		});
	}

	return query
};
