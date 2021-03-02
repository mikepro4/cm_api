const mongoose = require("mongoose");
const { Schema } = mongoose;

const videoSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    ticker: String,
    googleId: String,
    metadata: {
        id: String,
        title: String,
        link: String,
        thumbnail: String,
        channel: {
            name: String,
            link: String,
            verified: Boolean,
            thumbnail: String
        },
        description: String,
        views: String,
        uploaded: String,
        duration: Number
    }
});

videoSchema.index({
});

mongoose.model("videos", videoSchema);
