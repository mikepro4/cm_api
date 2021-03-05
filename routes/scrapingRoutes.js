const _ = require("lodash");
const mongoose = require("mongoose");

const { toggleScraper} = require('./../cron/scraping');
const Scraping = mongoose.model("scraping");

module.exports = app => {

	// ===========================================================================

	app.get("/scraping/toggle", async (req, res) => {
        toggleScraper()
        res.json({ status: "ok" });
    });
    
    // ===========================================================================

    app.post("/scraping/update", async (req, res) => {
        Scraping.update(
			{
				_id: req.body.id
			},
			{
				$set:  {
                    scrapingRunning: req.body.newScrapingSettings.scrapingRunning
                }
			},
			async (err, result) => {
				if (result) {
					res.json(result);
				}
			}
		);
    });

    // ===========================================================================

    app.get("/scraping/initiate", async (req, res) => {
        Scraping.findOne({}, async (err, scraping) => {
			if (scraping) {
                res.json(scraping);
                Scraping.remove({_id: scraping._id}, async (err) => {
                    if (err) return res.send(err);
                    const scrapingSettingsInitial = await new Scraping().save();
                    res.json(scrapingSettingsInitial);
                });
			} else {
                const scrapingSettingsInitial = await new Scraping().save();
                res.json(scrapingSettingsInitial);
            }
		});
    });

    
    // ===========================================================================

    app.get("/scraping/search_results/status", async (req, res) => {
        Scraping.findOne({}, async (err, scraping) => {
			if (scraping) {
				res.json(scraping);
			}
		});
    });

};


