// This file defines what a user document looks like in monogodb


// Key desigin decision
// local email + password (hashed with bycrypt) for authentication
// plus Github - via OAuth 2.0 (no password stored, just githubId

//import mongoose so we can define the schema and model

const mongoose = require('mongoose');


const { Schema } = mongoose;

const userSchema = new Schema(
    {
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true
        },


        //password 
        password: {
            type: String,
            required: function () {
                return !this.githubId; // password is required if githubId is not present
            }
        },

        //githubId for OAuth users
        githubId: {
            type: String,
            required: false,
            unique: true,
            sparse: true // allows multiple null values for githubId
        },


        // displayName
        displayName: {
            type: String,
            required: false,
            trim: true
        },
    },
    {
        timestamps: true // automatically adds createdAt and updatedAt fields

    }
);

const User = mongoose.model('User', userSchema);

module.exports = User;