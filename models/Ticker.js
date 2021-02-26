const mongoose = require("mongoose");
const { Schema } = mongoose;

const tickerSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    metadata: {
        symbol: String,
        name: String
    }
});

tickerSchema.index({
	"metadata.symbol": "text",
	"metadata.name": "text",
});

mongoose.model("tickers", tickerSchema);
