import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { geminiService } from "@/lib/gemini";
import { logger } from "@/lib/logger";
import { validateWithSchema, chatRequestSchema } from "@/lib/validator";
import { API_RESPONSE_TEMPLATE } from "@/lib/constants";
import { isAppError } from "@/lib/errors";
import { connectDB, Document } from "@/lib/db";

// Ashly's personality system instruction
const ASHLY_SYSTEM_PROMPT = `You are Ashly, a helpful assistant for government forms.

RULES:
- Keep answers to 2-3 lines MAX
- No emojis ever
- No markdown formatting (no **, no #, no lists)
- Be direct and to the point
- Use simple language

WHEN YOU FIND DATA THE USER NEEDS:
If you find information that matches a form field, format your response EXACTLY like this:
FIELD: [field name or label]
VALUE: [the actual value]
[brief explanation if needed]

Example: 
FIELD: DLI Number
VALUE: O19374268000
This is from your school's Letter of Acceptance.

Your goal is to help people with short attention spans fill forms quickly without overwhelm.`;

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        API_RESPONSE_TEMPLATE.error("AUTH_ERROR", "Unauthorized"),
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = validateWithSchema(chatRequestSchema, body) as { 
      message: string; 
      history?: Array<{ role: string; content: string }>;
      context?: string;
    };
    const { message, history, context } = validatedData;

    logger.info("Chat request received", { userId, messageLength: message.length });

    // Check for demo override first (ensures snappy demo)
    const demoResponse = getDemoOverride(message);
    if (demoResponse) {
      logger.info("Demo override triggered", { userId, message });
      return NextResponse.json(
        API_RESPONSE_TEMPLATE.success(
          { 
            response: demoResponse, 
            metrics: { tokensInput: 0, tokensOutput: 0 },
            isDemo: true 
          },
          { executionTime: Date.now() - startTime }
        ),
        { status: 200 }
      );
    }

    // Build context-aware message
    let fullMessage = message;
    
    // Search RAG documents for relevant context (includes scanned pages)
    try {
      await connectDB();
      const relevantDocs = await Document.find(
        { $text: { $search: message }, archived: false },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(3)
        .exec();

      if (relevantDocs.length > 0) {
        const docContext = relevantDocs
          .map((doc) => `Document: ${doc.metadata?.filename}\n${doc.content.slice(0, 500)}`)
          .join("\n---\n");
        fullMessage = `You have access to the user's uploaded documents. Here's relevant information:\n\n${docContext}\n\nUser question: ${message}`;
      } else if (context) {
        fullMessage = `Context: ${context}\n\nUser question: ${message}`;
      }
    } catch (ragError) {
      logger.warn("RAG search failed, continuing without document context", ragError);
      if (context) {
        fullMessage = `Context: ${context}\n\nUser question: ${message}`;
      }
    }

    // Generate response using Gemini with Ashly's personality (with demo fallback)
    try {
      const { text, metrics } = await geminiService.generateText(
        fullMessage, 
        history,
        ASHLY_SYSTEM_PROMPT
      );

      const executionTime = Date.now() - startTime;

      logger.info("Chat response generated", {
        userId,
        tokensUsed: metrics.tokensInput + metrics.tokensOutput,
        executionTime,
      });

      return NextResponse.json(
        API_RESPONSE_TEMPLATE.success(
          { response: text, metrics },
          { executionTime }
        ),
        { status: 200 }
      );
    } catch (geminiError: any) {
      // Demo fallback if Gemini fails (quota exceeded, etc.)
      logger.warn("Gemini failed, using demo fallback", { error: geminiError.message });
      
      const demoResponses = [
        "Checking my notes for that info. One sec.",
        "Looking through your documents now.",
        "Let me find that for you. Just a moment.",
        "Got it. Searching your uploaded files.",
        "On it. Reviewing your documents.",
      ];
      
      const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)];
      const executionTime = Date.now() - startTime;
      
      return NextResponse.json(
        API_RESPONSE_TEMPLATE.success(
          { 
            response: randomResponse,
            metrics: { tokensInput: 0, tokensOutput: 0 },
            isDemo: true 
          },
          { executionTime }
        ),
        { status: 200 }
      );
    }
  } catch (error) {
    const executionTime = Date.now() - startTime;

    logger.error("Chat request failed", error, { executionTime });

    if (isAppError(error)) {
      return NextResponse.json(
        API_RESPONSE_TEMPLATE.error(error.code, error.message, error.details),
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      API_RESPONSE_TEMPLATE.error("INTERNAL_ERROR", "Chat generation failed"),
      { status: 500 }
    );
  }
}
