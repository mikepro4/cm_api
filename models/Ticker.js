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
    lastWeek: { type: Number, default: 0 }
});

tickerSchema.index({
});

mongoose.model("tickers", tickerSchema);
