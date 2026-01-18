import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { voiceService } from "@/lib/voice";
import { logger } from "@/lib/logger";
import { validateWithSchema, speakRequestSchema } from "@/lib/validator";
import { API_RESPONSE_TEMPLATE } from "@/lib/constants";
import { isAppError } from "@/lib/errors";

// Voice ID mapping for different accents
// Note: You'll need to configure these with actual ElevenLabs voice IDs
const VOICE_IDS = {
  canadian: process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM", // Default voice
  indian: process.env.ELEVENLABS_VOICE_ID_INDIAN || "21m00Tcm4TlvDq8ikWAM", // TODO: Replace with Indian accent voice
  filipino: process.env.ELEVENLABS_VOICE_ID_FILIPINO || "21m00Tcm4TlvDq8ikWAM", // TODO: Replace with Filipino accent voice
};

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        API_RESPONSE_TEMPLATE.error("AUTH_ERROR", "Unauthorized"),
        { status: 401 }
      );
    }

    const body = await req.json();
    const { text, accent = "canadian" } = validateWithSchema(speakRequestSchema, body) as { 
      text: string; 
      accent?: "canadian" | "indian" | "filipino" 
    };

    // Select voice ID based on accent
    const voiceId = VOICE_IDS[accent] || VOICE_IDS.canadian;

    logger.info("Voice synthesis requested", { 
      userId, 
      textLength: text.length,
      accent,
      voiceId 
    });

    // Synthesize speech with selected voice and stream it
    const audioStream = await voiceService.synthesizeSpeechStream(text, voiceId);

    logger.info("Voice synthesis started", { userId, accent });

    // Return audio stream with appropriate headers
    return new NextResponse(audioStream, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": 'inline; filename="ashly-speech.mp3"',
        "Cache-Control": "no-cache",
        "X-Voice-Accent": accent,
      },
    });
  } catch (error) {
    logger.error("Voice synthesis failed", error);

    if (isAppError(error)) {
      return NextResponse.json(
        API_RESPONSE_TEMPLATE.error(error.code, error.message, error.details),
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      API_RESPONSE_TEMPLATE.error("INTERNAL_ERROR", "Voice synthesis failed"),
      { status: 500 }
    );
  }
}
