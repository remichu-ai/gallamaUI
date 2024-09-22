const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    title: {
        type: String,
        default: "Untitled Chat"
    },
    messages: [{
        type: Object,
        required: true
    }],
}, { timestamps: true });

module.exports = mongoose.model('Conversation', ConversationSchema);
