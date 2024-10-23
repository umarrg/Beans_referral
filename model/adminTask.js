const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AdminTaskSchema = new Schema({
    taskName: { type: String, required: true },
    points: { type: Number, required: true },
});

module.exports = mongoose.model('AdminTask', AdminTaskSchema);
