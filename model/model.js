const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RreferralUser = new Schema({
    username: { type: String, },
    telegramId: { type: String, required: true, unique: true },
    referralCode: { type: String, required: true },
    referredBy: { type: String, default: null },
    referralCount: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
});



module.exports = mongoose.model('referralUser', RreferralUser);