// Input validation and sanitization utilities

import { ValidationError } from "./errors";
import { z } from "zod";

// Sanitize string input to prevent XSS/injection
export function sanitizeString(input: string, maxLength: number = 10000): string {
  if (typeof input !== "string") {
    throw new ValidationError("Input must be a string");
  }

  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ""); // Remove dangerous characters
}

// Validate and sanitize chat messages
export function validateChatMessage(message: string): string {
  if (!message || message.trim().length === 0) {
    throw new ValidationError("Message cannot be empty");
  }
  if (message.length > 10000) {
    throw new ValidationError("Message too long (max 10000 characters)");
  }
  return sanitizeString(message);
}

// Validate query string for RAG
export function validateQuery(query: string): string {
  if (!query || query.trim().length === 0) {
    throw new ValidationError("Query cannot be empty");
  }
  if (query.length > 1000) {
    throw new ValidationError("Query too long (max 1000 characters)");
  }
  return sanitizeString(query);
}

// Validate text for voice synthesis
export function validateVoiceText(text: string): string {
  if (!text || text.trim().length === 0) {
    throw new ValidationError("Text cannot be empty");
  }
  if (text.length > 5000) {
    throw new ValidationError("Text too long for voice (max 5000 characters)");
  }
  return sanitizeString(text);
}

// Validate file content
export function validateFileContent(content: string, maxSize: number = 100000): string {
  if (!content) {
    throw new ValidationError("File content cannot be empty");
  }
  if (content.length > maxSize) {
    throw new ValidationError(
      `File too large (max ${maxSize} characters)`
    );
  }
  return sanitizeString(content, maxSize);
}

// API request validation using Zod
export const chatRequestSchema = z.object({
  message: z.string().min(1).max(10000),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).optional(),
});

export const ragRequestSchema = z.object({
  query: z.string().min(1).max(1000),
});

export const speakRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  accent: z.enum(["canadian", "indian", "filipino"]).optional().default("canadian"),
});

export const uploadFileSchema = z.object({
  content: z.string().max(100000),
  filename: z.string().min(1).max(255),
});

export function validateWithSchema<T>(schema: z.ZodSchema, data: unknown): T {
  try {
    return schema.parse(data) as T;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError("Invalid request data", error.errors);
    }
    throw error;
  }
}
