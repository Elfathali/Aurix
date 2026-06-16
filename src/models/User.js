const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },

    lastName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    authProvider: {
      type: String,
      enum: ["local", "google", "apple"],
      default: "local"
    },

    socialId: {
      type: String,
      trim: true
    },

    membershipType: {
      type: Number,
      default: 1
    },

    passwordHash: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      }
    },

    passwordResetCodeHash: {
      type: String
    },

    passwordResetCodeExpiresAt: {
      type: Date
    },

    phoneLoginCodeHash: {
      type: String
    },

    phoneLoginCodeExpiresAt: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
