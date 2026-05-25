


const mongoose = require('mongoose');

const { Schema } = mongoose;

const bookmarkSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'A bookmark must be associated with a user']
        },


        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true

        },

        url: {
            type: String,
            required: [true, 'URL is required'],
            trim: true,
        },

        description: {
            type: String,
            required: false,
            trim: true
        }
    },
    {
        timestamps: true // automatically adds createdAt and updatedAt fields

    }
);

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

module.exports = Bookmark;