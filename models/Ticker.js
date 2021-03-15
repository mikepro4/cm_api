const mongoose = require("mongoose");
const { Schema } = mongoose;

const tickerSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    metadata: {
        symbol: String,
        name: String
    },
    active: { type: Boolean, default: true },
    last24hours: { type: Number, default: 0 },
    last48hours: { type: Number, default: 0 },
    thisWeek: { type: Number, default: 0 },
    previousWeek: { type: Number, default: 0 },
    growthRate24: { type: Number, default: 0 },
    growthRate48: { type: Number, default: 0 },
    growthRate72: { type: Number, default: 0 },
    week: []

});

tickerSchema.index({
});

mongoose.model("tickers", tickerSchema);
