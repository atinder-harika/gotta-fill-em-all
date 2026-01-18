// Google Gemini AI Service
// Handles text generation, JSON generation, and embeddings

import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "./logger";
import { ExternalServiceError } from "./errors";
import { cache } from "./cache";
import { GEMINI_CONFIG } from "./constants";
import { Metrics } from "./db";


function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY;
  console.log("[DEBUG] GEMINI_API_KEY value:", key ? `${key.substring(0, 10)}...` : "undefined");
  console.log("[DEBUG] All env keys:", Object.keys(process.env).filter(k => k.includes('GEMINI')));
  if (!key) {
    logger.warn("GEMINI_API_KEY not configured - AI features will be unavailable");
    return null;
  }
  return new GoogleGenerativeAI(key);
}

interface GenerationMetrics {
  tokensInput: number;
  tokensOutput: number;
  executionTime: number;
}

export class GeminiService {
  private metrics: GenerationMetrics = { tokensInput: 0, tokensOutput: 0, executionTime: 0 };
  private totalTokensUsed = 0;

  async generateText(
    prompt: string,
    history?: Array<{ role: string; content: string }>,
    systemInstruction?: string
  ): Promise<{ text: string; metrics: GenerationMetrics }> {
    const genAI = getGeminiClient();
    if (!genAI) {
      throw new ExternalServiceError(
        "Gemini",
        "API key not configured"
      );
    }

    const startTime = Date.now();

    try {
      const modelConfig: any = { model: GEMINI_CONFIG.MODEL };
      
      // Add system instruction if provided
      if (systemInstruction) {
        modelConfig.systemInstruction = systemInstruction;
      }
      
      const model = genAI.getGenerativeModel(modelConfig);

      // Build conversation history
      const messages = history
        ? history.map((h) => ({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.content }],
          }))
        : [];

      const result = await model.generateContent({
        contents: [
          ...messages,
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: GEMINI_CONFIG.MAX_TOKENS,
          temperature: GEMINI_CONFIG.TEMPERATURE,
        },
      });

      const response = result.response;
      const text = response.text();

      // Estimate token count (rough approximation)
      const estimatedInputTokens = Math.ceil(prompt.length / 4);
      const estimatedOutputTokens = Math.ceil(text.length / 4);
      const executionTime = Date.now() - startTime;

      const metrics: GenerationMetrics = {
        tokensInput: estimatedInputTokens,
        tokensOutput: estimatedOutputTokens,
        executionTime,
      };

      this.metrics = metrics;
      this.totalTokensUsed += estimatedInputTokens + estimatedOutputTokens;

      logger.info("Gemini text generation completed", {
        tokensInput: metrics.tokensInput,
        tokensOutput: metrics.tokensOutput,
        executionTime: metrics.executionTime,
      });

      return { text, metrics };
    } catch (error) {
      logger.error("Gemini text generation failed", error);
      throw new ExternalServiceError("Gemini", error instanceof Error ? error.message : "Unknown error");
    }
  }

  async generateJSON(
    prompt: string,
    schema: string
  ): Promise<{ json: any; metrics: GenerationMetrics }> {
    const genAI = getGeminiClient();
    if (!genAI) {
      throw new ExternalServiceError("Gemini", "API key not configured");
    }

    const startTime = Date.now();

    try {
      const model = genAI.getGenerativeModel({
        model: GEMINI_CONFIG.MODEL,
        generationConfig: { responseMimeType: "application/json" },
      });

      const fullPrompt = `${prompt}\n\nExpected JSON schema:\n${schema}`;

      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      const jsonText = response.text();
      const json = JSON.parse(jsonText);

      const executionTime = Date.now() - startTime;
      const metrics: GenerationMetrics = {
        tokensInput: Math.ceil(fullPrompt.length / 4),
        tokensOutput: Math.ceil(jsonText.length / 4),
        executionTime,
      };

      this.totalTokensUsed += metrics.tokensInput + metrics.tokensOutput;

      logger.info("Gemini JSON generation completed", {
        executionTime: metrics.executionTime,
      });

      return { json, metrics };
    } catch (error) {
      logger.error("Gemini JSON generation failed", error);
      throw new ExternalServiceError("Gemini", error instanceof Error ? error.message : "JSON parse error");
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const genAI = getGeminiClient();
    if (!genAI) {
      throw new ExternalServiceError("Gemini", "API key not configured");
    }

    // Check cache first
    const cacheKey = `embedding:${text.slice(0, 100)}`;
    const cached = cache.get<number[]>(cacheKey);
    if (cached) {
      logger.info("Embedding retrieved from cache");
      return cached;
    }

    try {
      const model = genAI.getGenerativeModel({
        model: GEMINI_CONFIG.EMBEDDING_MODEL,
      });

      const result = await model.embedContent(text);
      const embedding = result.embedding.values;

      if (!embedding || embedding.length !== GEMINI_CONFIG.EMBEDDING_DIMENSIONS) {
        throw new Error(
          `Invalid embedding dimensions: expected ${GEMINI_CONFIG.EMBEDDING_DIMENSIONS}, got ${embedding?.length}`
        );
      }

      // Cache the embedding for 24 hours
      cache.set(cacheKey, embedding, 86400);

      logger.info("Embedding generated successfully");
      return embedding;
    } catch (error) {
      logger.error("Embedding generation failed", error);
      throw new ExternalServiceError("Gemini", error instanceof Error ? error.message : "Embedding error");
    }
  }

  getTotalTokensUsed(): number {
    return this.totalTokensUsed;
  }

  getLastMetrics(): GenerationMetrics {
    return this.metrics;
  }
}

export const geminiService = new GeminiService();
