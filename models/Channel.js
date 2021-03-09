const mongoose = require("mongoose");
const { Schema } = mongoose;

const channelSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    approved: { type: Boolean, default: false},
    spam: { type: Boolean, default: false},
    metadata: {
        name: String,
        link: String,
        verified: String,
        thumbnail: String
    },
    videosCount: Number,
    linkedTickers: [
      {
        symbol: String
      }
    ],
    bullScore: { type: Number, default: 0}
});

channelSchema.index({
});

mongoose.model("channels", channelSchema);
