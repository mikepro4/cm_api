var CronJob = require('cron').CronJob;

const mongoose = require("mongoose");
const Proxy = mongoose.model("proxies");

module.exports = app => {
    var job = new CronJob(
        '*/2 * * * * *',
        function() {

            Proxy.aggregate([{ $sample: { size: 1 } }]).then(results => {
                console.log(results)
            });
           
        },
        null,
        true,
        'America/Los_Angeles'
    );

    job.start()
}
