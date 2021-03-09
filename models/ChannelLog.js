const mongoose = require("mongoose");
const { Schema } = mongoose;

const channelLogSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    metadata: {
        type: String,
        channelUrl: String,
        channelTitle: String,
        channelId: String,
        symbol: String
    }
});

channelLogSchema.index({
});

mongoose.model("channellogs", channelLogSchema);
