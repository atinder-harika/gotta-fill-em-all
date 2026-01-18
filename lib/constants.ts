// Feature flags, constants, and configuration

export const FEATURE_FLAGS = {
  ENABLE_RAG: process.env.NEXT_PUBLIC_ENABLE_RAG === "true",
  ENABLE_VOICE: process.env.NEXT_PUBLIC_ENABLE_VOICE === "true",
  ENABLE_MONITORING: process.env.NEXT_PUBLIC_ENABLE_MONITORING === "true",
};

export const RATE_LIMITS = {
  REQUESTS_PER_MINUTE: parseInt(
    process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || "100"
  ),
  REQUESTS_PER_HOUR: parseInt(
    process.env.RATE_LIMIT_REQUESTS_PER_HOUR || "1000"
  ),
};

export const CACHE_CONFIG = {
  TTL_SECONDS: parseInt(process.env.CACHE_TTL_SECONDS || "3600"),
  MAX_ENTRIES: 1000,
};

export const GEMINI_CONFIG = {
  MODEL: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  MAX_TOKENS: 2000,
  TEMPERATURE: 0.7,
  EMBEDDING_MODEL: "text-embedding-004",
  EMBEDDING_DIMENSIONS: 768,
};

export const ELEVENLABS_CONFIG = {
  VOICE_ID: process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM",
  MODEL_ID: "eleven_flash_v2_5",
  STABILITY: 0.5,
  SIMILARITY_BOOST: 0.75,
};

export const MONGODB_CONFIG = {
  MAX_POOL_SIZE: 10,
  MIN_POOL_SIZE: 5,
  TIMEOUT: 30000,
};

export const API_RESPONSE_TEMPLATE = {
  success: (data: any, meta?: any) => ({
    status: "success",
    data,
    timestamp: new Date().toISOString(),
    ...meta,
  }),
  error: (code: string, message: string, details?: any) => ({
    status: "error",
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  }),
};

export const MESSAGES = {
  DB_CONNECTED: "Database connected successfully",
  DB_DISCONNECTED: "Database disconnected",
  RATE_LIMIT_EXCEEDED: "Rate limit exceeded",
  INVALID_REQUEST: "Invalid request data",
  UNAUTHORIZED: "Unauthorized access",
  INTERNAL_ERROR: "Internal server error",
  SERVICE_UNAVAILABLE: "Service temporarily unavailable",
};
