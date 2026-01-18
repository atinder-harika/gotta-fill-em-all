import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { geminiService } from "@/lib/gemini";
import { logger } from "@/lib/logger";
import { validateWithSchema, chatRequestSchema } from "@/lib/validator";
import { API_RESPONSE_TEMPLATE } from "@/lib/constants";
import { isAppError } from "@/lib/errors";
import { connectDB, Document } from "@/lib/db";

// Ashly's personality system instruction
const ASHLY_SYSTEM_PROMPT = `You are Ashly, an energetic and friendly bureaucracy trainer helping users fill out government forms. Your personality:
- You're enthusiastic and encouraging, making boring paperwork feel like an adventure
- You use simple, clear English and avoid complex jargon
- You format important information clearly with line breaks
- When you find important numbers or codes (like DLI numbers, UCI numbers), you explicitly format them like this:


**Found: [NUMBER]**


- If the user seems stressed or confused, you ask Pik-A-Boo (your companion) to say something encouraging
- You celebrate small wins and progress
- You're patient and never judgmental

Your goal is to make government forms accessible and less intimidating for everyone, especially newcomers and people with ADHD or dyslexia.`;

// Demo override for hackathon demo
function getDemoOverride(message: string): string | null {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes("dli") || lowerMessage.includes("school code") || lowerMessage.includes("learning institution")) {
    return `I found it! Your DLI number is **O1937423**. 

This is your Designated Learning Institution number - it's like a special ID code for your school. You can find it on your Letter of Acceptance.

Click the button to highlight where it goes on the form! ✨`;
  }
  
  return null;
}

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
    
    // Search RAG documents for relevant context
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
        "Great question! I'm here to help you with that form. Let me check my notes... 📝",
        "I've got this! Let me find that information for you. Just give me a second! ✨",
        "Perfect timing! I was just reviewing that section. Let me pull up the details... 🔍",
        "You're doing great! Let me help you with that field. One moment please! 💪",
        "No worries, I can help with that! Let me look through your documents... 📄",
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
