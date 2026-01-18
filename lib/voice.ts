// ElevenLabs Voice Synthesis Service
// Handles text-to-speech conversion and audio streaming

import { logger } from "./logger";
import { ExternalServiceError } from "./errors";
import { ELEVENLABS_CONFIG } from "./constants";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  logger.warn("ELEVENLABS_API_KEY not configured - voice features will be unavailable");
}

export class VoiceService {
  private apiKey = ELEVENLABS_API_KEY;
  private voiceId = ELEVENLABS_CONFIG.VOICE_ID;
  private modelId = ELEVENLABS_CONFIG.MODEL_ID;

  async synthesizeSpeech(text: string): Promise<ArrayBuffer> {
    if (!this.apiKey) {
      throw new ExternalServiceError(
        "ElevenLabs",
        "API key not configured"
      );
    }

    try {
      logger.info("Starting voice synthesis", { textLength: text.length });

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}/stream`,
        {
          method: "POST",
          headers: {
            "xi-api-key": this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            model_id: this.modelId,
            voice_settings: {
              stability: ELEVENLABS_CONFIG.STABILITY,
              similarity_boost: ELEVENLABS_CONFIG.SIMILARITY_BOOST,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        logger.error("ElevenLabs API error", new Error(error));
        throw new ExternalServiceError(
          "ElevenLabs",
          `HTTP ${response.status}: ${error}`
        );
      }

      const audioBuffer = await response.arrayBuffer();

      logger.info("Voice synthesis completed successfully", {
        audioSize: audioBuffer.byteLength,
      });

      return audioBuffer;
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }
      logger.error("Voice synthesis failed", error);
      throw new ExternalServiceError(
        "ElevenLabs",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  async synthesizeSpeechStream(text: string, voiceId?: string): Promise<ReadableStream<Uint8Array>> {
    if (!this.apiKey) {
      throw new ExternalServiceError("ElevenLabs", "API key not configured");
    }

    // Use provided voiceId or fall back to default
    const selectedVoiceId = voiceId || this.voiceId;

    try {
      logger.info("Starting voice synthesis stream", { 
        textLength: text.length,
        voiceId: selectedVoiceId 
      });

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}/stream`,
        {
          method: "POST",
          headers: {
            "xi-api-key": this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            model_id: this.modelId,
            voice_settings: {
              stability: ELEVENLABS_CONFIG.STABILITY,
              similarity_boost: ELEVENLABS_CONFIG.SIMILARITY_BOOST,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        logger.error("ElevenLabs API error", new Error(error));
        throw new ExternalServiceError(
          "ElevenLabs",
          `HTTP ${response.status}: ${error}`
        );
      }

      logger.info("Voice synthesis stream started");

      return response.body as ReadableStream<Uint8Array>;
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }
      logger.error("Voice synthesis stream failed", error);
      throw new ExternalServiceError(
        "ElevenLabs",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  async getAvailableVoices(): Promise<any[]> {
    if (!this.apiKey) {
      throw new ExternalServiceError("ElevenLabs", "API key not configured");
    }

    try {
      const response = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: {
          "xi-api-key": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      logger.error("Failed to fetch voices", error);
      throw new ExternalServiceError(
        "ElevenLabs",
        error instanceof Error ? error.message : "Failed to fetch voices"
      );
    }
  }
}

export const voiceService = new VoiceService();
