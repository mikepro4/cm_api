const mongoose = require("mongoose");
const { Schema } = mongoose;

const notificationSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    user: {},
    message: String,
    type: String,
    link: String
});

notificationSchema.index({
});

mongoose.model("notifications", notificationSchema);
