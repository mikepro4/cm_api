const _ = require("lodash");
const mongoose = require("mongoose");

const { toggleScraper} = require('./../cron/scraping');



module.exports = app => {

	// ===========================================================================

	app.get("/scrapping/toggle", async (req, res) => {
        toggleScraper()
        res.json({ status: "ok" });
    });
    
    // ===========================================================================
};


