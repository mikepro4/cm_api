const parse = require('csv-parse');
const fs = require('fs');
const mongoose = require("mongoose");
const Ticker = mongoose.model("tickers");
const rp = require('request-promise');

const _ = require("lodash");
 
module.exports = app => {
    const processFile = async (file, type) => {
        records = []
        const parser = fs
        .createReadStream(file)
        .pipe(parse({
            // CSV options if any
        }));
        // _.map(parser, async (record) => {
        //    console.log(record)
        // })
        for await (const record of parser) {

            Ticker.findOne({ "metadata.symbol": record[0] }, async (err, ticker) => {
                if (ticker) {
                    console.log("skip", record)
                } else {
                    const newTicker = await new Ticker({
                        createdAt: new Date(),
                        metadata: {
                            symbol: record[0],
                            name: record[1]
                        },
                        type: type,
                        marketCap: record[5],
                        IPOYear: record[7],
                        sector: record[9],
                        industry: record[10]
                    }).save();

                    if(newTicker) {
                        console.log("add")
                    }
                }
            });

            records.push(record)
        }
        return records
    }

    const loadCrypto = async () => {
        const requestOptions = {
            method: 'GET',
            uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest',
            qs: {
              'start': '1',
              'limit': '5000',
              'convert': 'USD'
            },
            headers: {
              'X-CMC_PRO_API_KEY': 'e1a6b877-efd6-4fb9-8418-f81ee99aad04'
            },
            json: true,
            gzip: true
          };
          
          rp(requestOptions).then(response => {
            _.map(response.data, (item, i) => {
                Ticker.findOne({ "metadata.symbol": item.symbol }, async (err, ticker) => {
                    if (ticker) {
                        console.log("skip", item)

                        Ticker.updateOne(
                            {
                                "metadata.symbol": item.symbol 
                            },
                            {
                                $set: { crypto: {
                                    max_supply: item.max_supply,
                                    num_market_pairs: item.num_market_pairs,
                                    circulating_supply: item.circulating_supply,
                                    total_supply: item.total_supply,
                                    cmc_rank: item.cmc_rank,
                                    quote: item.quote
                                }}
                            },
                            async (err, info) => {
                                if (err) res.status(400).send({ error: "true", error: err });
                                if (info) {
                                   console.log("updated ticker")
                                }
                            }
                        );
                    } else {
                        const newTicker = await new Ticker({
                            createdAt: new Date(),
                            metadata: {
                                symbol: item.symbol,
                                name: item.name
                            },
                            type: "crypto",
                            tags: item.tags,
                            altNames: [item.name],
                            crypto: {
                                max_supply: item.max_supply,
                                num_market_pairs: item.num_market_pairs,
                                circulating_supply: item.circulating_supply,
                                total_supply: item.total_supply,
                                cmc_rank: item.cmc_rank,
                                quote: item.qoute
                            }
                        }).save();
    
                        if(newTicker) {
                            console.log("add")
                        }
                    }
                });
            })
          }).catch((err) => {
            console.log('API call error:', err.message);
          });
          
    }


    (async () => {
        // const nyse = await processFile(`./csv/nyse.csv`, "regular")
        // const nasdaq = await processFile(`./csv/nasdaq.csv`, "regular")
        // await loadCrypto()


    //   console.info(records);
    //   _.map(records, async (record, i) => {
    //       setTimeout(() => {
    //         console.log(record)
    //       }, i*1000)
    //     })
    })()
}