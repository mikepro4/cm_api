const mongoose = require("mongoose");
const { Schema } = mongoose;

const proxySchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    metadata: {
        ip: String,
        port: String
    }
});

proxySchema.index({
	"metadata.ip": "text",
	"metadata.port": "text",
});

mongoose.model("proxies", proxySchema);
