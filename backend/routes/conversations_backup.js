const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');

// Save conversation
router.post('/save', async (req, res) => {
    const { messages } = req.body;
    // Create a new conversation with a unique ID
    const conversation = new Conversation({
        _id: new mongoose.Types.ObjectId(),
        messages
    });

    try {
        // Save conversation to MongoDB
        await conversation.save();
        res.status(200).json({ id: conversation._id.toString() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Fetch conversation by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const conversation = await Conversation.findById(id);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }
        res.status(200).json(conversation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Fetch all conversations
router.get('/', async (req, res) => {
    try {
        const conversations = await Conversation.find(); // Fetch all conversations from MongoDB
        res.status(200).json(conversations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
