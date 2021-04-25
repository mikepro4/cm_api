const mongoose = require("mongoose");
const { Schema } = mongoose;

const postSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    content: String,
    user: {},
    linkedTickers: [],
    linkedUsers: [],
    sentiment: String
});

postSchema.index({
});

mongoose.model("posts", postSchema);
