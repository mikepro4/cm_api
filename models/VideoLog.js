const mongoose = require("mongoose");
const { Schema } = mongoose;

const videoLogSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    metadata: {
        type: String,
        symbol: String,
        proxy: String,
        videoTitle: String,
        videoThumbnail: String,
        channelTitle: String,
        channelUrl: String,
        videoId: String
    }
});

videoLogSchema.index({
});

mongoose.model("videologs", videoLogSchema);
