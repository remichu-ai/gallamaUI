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

// Add indexes for better query performance
ConversationSchema.index({ createdAt: -1 });
ConversationSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
