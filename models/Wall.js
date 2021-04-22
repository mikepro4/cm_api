const mongoose = require("mongoose");
const { Schema } = mongoose;

const wallSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    owner: String,
    lastUpdated: { type: Date, default: Date.now }
});

wallSchema.index({
    "owner": "text"
});

mongoose.model("walls", wallSchema);
