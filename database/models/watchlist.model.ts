import mongoose, { Document, Schema, model } from "mongoose";

// Interface for Watchlist items extending Mongoose Document
export interface WatchlistItem extends Document {
  userId: string;
  symbol: string;
  company: string;
  addedAt: Date;
}

// Define the Watchlist schema
const watchlistSchema = new Schema<WatchlistItem>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false },
);

// Create compound index to prevent duplicate symbols per user
watchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

// Use the pattern to avoid hot-reload issues in Next.js
const Watchlist =
  mongoose.models?.Watchlist ||
  model<WatchlistItem>("Watchlist", watchlistSchema);

export default Watchlist;
