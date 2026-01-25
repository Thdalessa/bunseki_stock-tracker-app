import { connectToDatabase } from "../../../database/mongoose";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("Testing database connection...");
    const mongooseInstance = await connectToDatabase();
    const connection = mongooseInstance.connection;

    return NextResponse.json({
      success: true,
      message: "Successfully connected to MongoDB",
      details: {
        name: connection.name,
        host: connection.host,
        port: connection.port,
        readyState: connection.readyState, // 1 = connected
      },
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to connect to MongoDB",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
