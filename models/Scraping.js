const mongoose = require("mongoose");
const { Schema } = mongoose;

const scrapingSchema = new Schema({
    scrapingRunning:  {type: Boolean, default: true},
    delayNextTicker: {type: Number, default: 1000},
    delayStartOver: {type: Number, default: 10000},
    type: String
});


mongoose.model("scraping", scrapingSchema);
