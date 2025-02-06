const mongoose = require("mongoose");

const TokenSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now, /* expires: 3600 */ }, // Expires after 1 hour
});

module.exports = mongoose.model("Token", TokenSchema);
