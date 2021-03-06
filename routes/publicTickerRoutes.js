const _ = require("lodash");
const mongoose = require("mongoose");
const Ticker = mongoose.model("tickers");
const Connection = mongoose.model("connections");

const passport = require('passport');
const requireAuth = passport.authenticate('jwt', { session: false });

var yahooFinance = require('yahoo-finance');

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
                    following: true,
                    connection
                });
			} else {
                res.json({
                    following: false,
                    connection
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
                    count: userList.length,
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
				$set: { 
					"metadata.symbol": req.body.symbol,
					"metadata.name": req.body.name, 
					altNames: req.body.altNames, 
					strictNameCheck: req.body.strictNameCheck, 
					type: req.body.type,
					active: req.body.active,
					special: req.body.special,
				}
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

    // ===========================================================================
    
    app.post("/public/ticker/follow", requireAuth, async (req, res) => {
        let newUser = {
            "_id": req.user._id.toString(),
            avatar: req.user.avatar,
            avatarDefault: req.user.avatarDefault,
            avatarGradient: req.user.avatarGradient,
            username: req.user.username
        }

		const connection = await new Connection({
            createdAt: new Date(),
            object: newUser,
            subject: { symbol: req.body.symbol}
        }).save();
        
		res.json(connection);
    });

    // ===========================================================================
    
    app.post("/public/ticker/unfollow", requireAuth, async (req, res) => {
        Connection.remove({ _id: req.body.connectionId }, async (err) => {
			if (err) return res.send(err);
			res.json({
				success: "true",
				message: "deleted connection"
			});
		});
    });

    // ===========================================================================
  
    app.post("/public/ticker/prices", async (req, res) => {
        // yahooFinance.historical(req.body, function (err, quotes) {
        //     res.json(quotes);
        // })

        // yahooFinance.historical(req.body, function (err, quotes) {
        //     res.json(quotes);
        // })

        const historical = yahooFinance.historical(req.body)
        const current = yahooFinance.quote({
            symbol: req.body.symbol,
            modules: [ 'price', 'summaryDetail' ] 
        })


        return Promise.all(
			[historical, current]
		).then(
			results => {
				return res.json({
                    history: results[0],
                    current: results[1]
                });
			}
		);

    });

    // ===========================================================================
  
    app.post("/public/ticker/single_price", async (req, res) => {

        const current = yahooFinance.quote({
            symbol: req.body.symbol,
            modules: [ 'price', 'summaryDetail' ] 
        })

        return Promise.all(
			[current]
		).then(
			results => {
				return res.json(results[0]);
			}
		);

    });
};

const buildQuery = criteria => {
	const query = {};

	return query
};
