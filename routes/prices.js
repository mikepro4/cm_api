const _ = require("lodash");
const mongoose = require("mongoose");
var yahooFinance = require('yahoo-finance');


module.exports = app => {
	app.post("/prices/", async (req, res) => {
        console.log(req.body)

        yahooFinance.historical({
            symbol: req.body.ticker,
            from: '2021-04-01',
            to: '2021-04-11',
            // period: 'd',
            }, function (err, quotes) {
                res.json(quotes);
            }
        )
    });

    app.post("/prices/week", async (req, res) => {
        yahooFinance.historical(req.body, function (err, quotes) {
            res.json(quotes);
        })
    });

};

const buildQuery = criteria => {
	const query = {};

	return query
};
