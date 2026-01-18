import mongoose from "mongoose";
import { logger } from "./logger";
import { DatabaseError } from "./errors";
import { MONGODB_CONFIG } from "./constants";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached: CachedConnection = {
  conn: null,
  promise: null,
};

export async function connectDB() {
  if (cached.conn) {
    logger.debug("Using cached MongoDB connection");
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("[DB] Starting MongoDB connection attempt...");
    cached.promise = Promise.race([
      mongoose
        .connect(MONGODB_URI, {
          maxPoolSize: MONGODB_CONFIG.MAX_POOL_SIZE,
          minPoolSize: MONGODB_CONFIG.MIN_POOL_SIZE,
          socketTimeoutMS: 5000, // 5 second socket timeout
          connectTimeoutMS: 5000, // 5 second connection timeout
          serverSelectionTimeoutMS: 5000, // 5 second server selection timeout
        })
        .then((result) => {
          console.log("[DB] MongoDB connected successfully");
          logger.info("MongoDB connected successfully", {
            host: result.connection.host,
          });
          return result;
        })
        .catch((error) => {
          console.error("[DB] MongoDB connection error:", error.message);
          logger.error("MongoDB connection failed", error);
          cached.promise = null;
          throw new DatabaseError(`Failed to connect to MongoDB: ${error.message}`);
        }),
      new Promise((_, reject) =>
        setTimeout(() => {
          console.error("[DB] MongoDB connection timeout after 8s");
          cached.promise = null;
          reject(new DatabaseError("MongoDB connection timeout - please check your connection string and network"));
        }, 8000)
      ),
    ]);
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    throw error;
  }
}

export async function disconnectDB() {
  if (cached.conn) {
    await cached.conn.disconnect();
    cached.conn = null;
    cached.promise = null;
    logger.info("MongoDB disconnected");
  }
}

// Document Schema for RAG
const documentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      maxlength: 500000, // Increased from 100000 to 500000 characters (~500KB)
      index: true,
    },
    metadata: {
      source: String,
      filename: String,
      uploadedAt: { type: Date, default: Date.now },
      uploadedBy: String,
      tags: [String],
    },
    embedding: {
      type: [Number],
      required: false,
      index: true, // For vector search
    },
    version: { type: Number, default: 1 },
    archived: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Create text index for full-text search
documentSchema.index({ content: "text", "metadata.tags": "text" });

// Vector index for semantic search (if MongoDB supports it)
documentSchema.index({ embedding: "2dsphere" });

export const Document =
  mongoose.models.Document || mongoose.model("Document", documentSchema);

// Chat History Schema
const chatHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    metadata: {
      tokensUsed: Number,
      model: String,
      executionTime: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying of user chat history
chatHistorySchema.index({ userId: 1, createdAt: -1 });

export const ChatHistory =
  mongoose.models.ChatHistory ||
  mongoose.model("ChatHistory", chatHistorySchema);

// System Metrics Schema for monitoring
const metricsSchema = new mongoose.Schema(
  {
    endpoint: String,
    method: String,
    statusCode: Number,
    responseTime: Number,
    tokensUsed: Number,
    error: String,
    userId: String,
  },
  {
    timestamps: true,
  }
);

metricsSchema.index({ endpoint: 1, createdAt: -1 });
metricsSchema.index({ createdAt: -1 });

export const Metrics =
  mongoose.models.Metrics || mongoose.model("Metrics", metricsSchema);
