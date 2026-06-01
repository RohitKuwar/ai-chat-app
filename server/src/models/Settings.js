import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true,
  },

  voiceURI: {
    type: String,
    default: "",
  },

  theme: {
    type: String,
    default: "dark-navy",
  },

  model: {
    type: String,
    default: "gpt-4o-mini",
  },

  temperature: {
    type: Number,
    default: 0.5,
  },
});

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;