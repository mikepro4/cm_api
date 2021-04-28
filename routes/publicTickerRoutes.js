const _ = require("lodash");
const mongoose = require("mongoose");
const Ticker = mongoose.model("tickers");
const Connection = mongoose.model("connections");

const passport = require('passport');
const requireAuth = passport.authenticate('jwt', { session: false });

module.exports = app => {

	// ===========================================================================

	app.post("/public/tickers/update", async (req, res) => {
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

	app.post("/public/tickers/delete", async (req, res) => {
		// Ticker.remove({ _id: req.body.tickerId }, async (err) => {
		// 	if (err) return res.send(err);
		// 	res.json({
		// 		success: "true",
		// 		message: "deleted ticker"
		// 	});
		// });
	});

	// ===========================================================================

	app.post("/public/tickers/item", async (req, res) => {
		Ticker.findOne({ "metadata.symbol": req.body.symbol }, async (err, ticker) => {
			if (ticker) {
				res.json(ticker);
			}
		});
	});

    // ===========================================================================
    
    app.post("/public/ticker/get_connection",requireAuth,  async (req, res) => {
		const query1 = Connection.findOne({ 
            "object._id": req.body.userId, 
            "subject.symbol": req.body.symbol
        }, async (err, connection) => {
			if (connection) {
				res.json({
                    following: true
                });
			} else {
                res.json({
                    following: false
                })
            }
		})
    });
    
    // ===========================================================================

    app.post("/public/ticker/get_followers", async (req, res) => {
		// Connection.find({ "subject.symbol": req.body.symbol}, async (err, results) => {
		// 	if (err) return res.send(err);
		// 	res.json({
        //         count: results.length,
        //         featured: [results[0], results[1], results[2]]
		// 	});
        // })
        
        const query = Connection.find({ "subject.symbol": req.body.symbol})
			.sort({"createdAt": -1, "_id": 1})

		return Promise.all(
			[query]
		).then(
			results => {
                userList = results[0]
				return res.json({
                    count: results.length,
                    featured: [userList[0], userList[1], userList[2]]
                });
			}
		);
    })
    
    // ===========================================================================

    

	app.post("/public/ticker/update", async (req, res) => {
		Ticker.update(
			{
				_id: req.body.tickerId
			},
			{
				$set: { "metadata.name": req.body.name }
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
    
    app.post("/public/ticker/avatar_update", async (req, res) => {
		Ticker.update(
			{
				_id: req.body.tickerId
			},
			{
				$set: { avatar: req.body.url }
			},
			async (err, info) => {
				if (err) res.status(400).send({ error: "true", error: err });
				if (info) {
					Ticker.findOne({ _id: req.body.tickerId }, async (err, ticker) => {
						if (ticker) {
							res.json(ticker);
						}
					});
				}
			}
		);
	});
};

const buildQuery = criteria => {
	const query = {};

	return query
};
