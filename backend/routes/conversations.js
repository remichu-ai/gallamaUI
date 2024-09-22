const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');

// Save conversation
router.post('/save', async (req, res) => {
    const { messages, title } = req.body;
    const conversation = new Conversation({
        _id: new mongoose.Types.ObjectId(),
        messages,
        title: title || "Untitled Chat"
    });

    try {
        await conversation.save();
        res.status(200).json({ id: conversation._id.toString() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update conversation by ID
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { messages, title } = req.body;

    try {
        const updatedConversation = await Conversation.findByIdAndUpdate(
            id,
            { messages, title },
            { new: true, runValidators: true }
        );

        if (!updatedConversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        res.status(200).json({ id: updatedConversation._id.toString() });
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
        const conversations = await Conversation.find({}, '_id title'); // Only fetch _id and title
        res.status(200).json(conversations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete conversation by ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedConversation = await Conversation.findByIdAndDelete(id);

        if (!deletedConversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        res.status(200).json({ message: 'Conversation successfully deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;