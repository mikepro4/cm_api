var CronJob = require('cron').CronJob;

const mongoose = require("mongoose");
const request = require('request-promise');

const YoutubeSearch = require("./scrape_yt_search");

module.exports = app => {
    var job = new CronJob(
        '*/2 * * * * *',
        function() {

            YoutubeSearch.search('AQB', {sp : "CAI%253D"}).then(results => {
                results.videos.map((result) => {
                    return console.log(result)
                })
            }).catch((err) => console.log(err));

            
            // Proxy.aggregate([{ $sample: { size: 1 } }]).then(random => {

            //     // const options = {
            //     //     requestOptions: {
            //     //         host: results[0].metadata.ip,
            //     //         port: parseInt(results[0].metadata.port)
            //     //     }
            //     // };

            //     const options = {
            //         requestOptions: {
            //             host: "41.79.33.14",
            //             port: 5678
            //         }
            //     };
                
            //     youtube.search('PLTR', options).then(results => {
            //         console.log(results.videos); 
            //     });
    
            // });

            // const options = {
            //     requestOptions: {
            //         proxy: "http://user-cashmachine:Octatrack2$@gate.smartproxy.com:7000",
            //     }
            // };
            
            // youtube.search('PLTR', options).then(results => {
            //     console.log(results); 
            // }).catch((err) => console.log(err));


            // request({
            //         url: 'https://www.youtube.com/results?search_query=pltr',
            //         proxy: 'http://user-cashmachine:Octatrack2$@gate.smartproxy.com:7000',
            //         headers: {
            //             'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Safari/537.36.'
            //         }
            //     })
            //     .then((response) => {console.log(response)})
            //     .catch(console.error);

            // axios
            //     .get('https://www.youtube.com/results?search_query=pltr', {
            //         proxy: {
            //             host: 'gate.smartproxy.com',
            //             port: 10000
            //         }
            //     })
            //     .then((response) => {

            //         if(response.status === 200) {
            //             const html = response.data;
            //             const $ = cheerio.load(html); 
            //             console.log($)
            //         }
                
            //     })
            //     .catch((err) => console.log(err));

                
        },
        null,
        true,
        'America/Los_Angeles'
    );

    job.start()
}
