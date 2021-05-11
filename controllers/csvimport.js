const parse = require('csv-parse');
const fs = require('fs');
const mongoose = require("mongoose");
const Ticker = mongoose.model("tickers");
 
module.exports = app => {
    const processFile = async () => {
    records = []
    const parser = fs
    .createReadStream(`./csv/nasdaq.csv`)
    .pipe(parse({
        // CSV options if any
    }));
    for await (const record of parser) {
        // Work with each record
        // console.log(record)

        // const ticker = await new Ticker({
        //     createdAt: new Date(),
        //     metadata: {
        //         symbol: record[0],
        //         name: record[1]
        //     }
        // }).save();

        // records.push(record)
    }
    return records
    }

    (async () => {
    const records = await processFile()
    //   console.info(records);
    })()
}