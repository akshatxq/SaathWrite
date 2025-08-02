import mongoose from "mongoose"

const BoardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  elements: {
    type: Array,
    default: [],
  },
  canvasColor: {
    type: String,
    default: "#121212",
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  thumbnail: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.models.Board || mongoose.model("Board", BoardSchema)
