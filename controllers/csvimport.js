const parse = require('csv-parse');
const fs = require('fs');
const mongoose = require("mongoose");
const Ticker = mongoose.model("tickers");

const _ = require("lodash");
 
module.exports = app => {
    const processFile = async () => {
        records = []
        const parser = fs
        .createReadStream(`./csv/nasdaq.csv`)
        .pipe(parse({
            // CSV options if any
        }));
        // _.map(parser, async (record) => {
        //    console.log(record)
        // })
        for await (const record of parser) {
            // console.log(record)
            // // Work with each record
            // setTimeout(() => {
            //     console.log(parser)
            // }, i*record)

            // const ticker = await new Ticker({
            //     createdAt: new Date(),
            //     metadata: {
            //         symbol: record[0],
            //         name: record[1]
            //     }
            // }).save();

            records.push(record)
        }
        return records
    }

    (async () => {
    const records = await processFile()
    //   console.info(records);
    //   _.map(records, async (record, i) => {
    //       setTimeout(() => {
    //         console.log(record)
    //       }, i*1000)
    //     })
    })()
}