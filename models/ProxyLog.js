const mongoose = require("mongoose");
const { Schema } = mongoose;

const proxyLogSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    metadata: {
        type: String,
        proxy: String,
        symbol: String
    }
});

proxyLogSchema.index({
});

mongoose.model("proxylogs", proxyLogSchema);
