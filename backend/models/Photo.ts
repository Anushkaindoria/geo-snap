import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const photoSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => uuidv4(),
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },

    url: {
      type: String,
      required: true,
    },

    lat: {
      type: Number,
      required: true,
    },

    lng: {
      type: Number,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    capturedAt: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const Photo = mongoose.model("Photo", photoSchema);

export default Photo;