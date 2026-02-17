"use server";

import { connectToDatabase } from "@/database/mongoose";
import Watchlist from "@/database/models/watchlist.model";

/**
 * Get all watchlist symbols for a user by their email
 * @param email User's email address
 * @returns Array of stock symbols or empty array if user not found/error
 */
export const getWatchlistSymbolsByEmail = async (
  email: string,
): Promise<string[]> => {
  try {
    // Connect to database
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("MongoDB connection not found");
    }

    // Find user by email in the user collection
    const user = await db.collection("user").findOne({ email });

    if (!user) {
      console.log("User not found for the provided email");
      return [];
    }

    // Query watchlist by userId
    const watchlistItems = await Watchlist.find({
      userId: user.id,
    }).select("symbol");

    // Return just the symbols as strings
    return watchlistItems.map((item) => item.symbol);
  } catch (error) {
    console.error("Error fetching watchlist symbols:", error);
    return [];
  }
};
