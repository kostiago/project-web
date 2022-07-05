const mongoose = require('mongoose');

const eventShema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    date: {
        type: Date,
    },
    photos: {
        type: Array
    },
    private: {
        type: Boolean
    },
    userId: {
        type: mongoose.ObjectId
    },
});

const Event = mongoose.model('Event', eventShema);

module.exports = Event;