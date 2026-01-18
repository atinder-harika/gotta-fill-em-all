import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB, Document } from "@/lib/db";
import { geminiService } from "@/lib/gemini";
import { logger } from "@/lib/logger";
import { validateWithSchema, ragRequestSchema } from "@/lib/validator";
import { API_RESPONSE_TEMPLATE } from "@/lib/constants";
import { isAppError } from "@/lib/errors";

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
    const { query } = validateWithSchema(ragRequestSchema, body);

    logger.info("RAG search initiated", { userId, query });

    // Connect to database
    await connectDB();

    // Generate embedding for the query
    const queryEmbedding = await geminiService.generateEmbedding(query);

    // Search for similar documents in MongoDB
    // Using text search as fallback for vector search
    const similarDocuments = await Document.find(
      { $text: { $search: query }, archived: false },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(5)
      .exec();

    logger.info("Documents retrieved from database", {
      count: similarDocuments.length,
    });

    // Prepare context from retrieved documents
    const context = similarDocuments
      .map((doc) => doc.content)
      .join("\n---\n");

    // Generate response using context
    const augmentedPrompt = `Using the following context, answer the user's query:\n\nContext:\n${context}\n\nQuery: ${query}`;
    const { text, metrics } = await geminiService.generateText(augmentedPrompt);

    const executionTime = Date.now() - startTime;

    logger.info("RAG response generated", {
      userId,
      docsFound: similarDocuments.length,
      executionTime,
    });

    return NextResponse.json(
      API_RESPONSE_TEMPLATE.success(
        {
          response: text,
          context: similarDocuments.map((doc) => ({
            id: doc._id,
            source: doc.metadata?.source,
            filename: doc.metadata?.filename,
            excerpt: doc.content.slice(0, 200),
          })),
          metrics,
        },
        { executionTime }
      ),
      { status: 200 }
    );
  } catch (error) {
    const executionTime = Date.now() - startTime;

    logger.error("RAG search failed", error, { executionTime });

    if (isAppError(error)) {
      return NextResponse.json(
        API_RESPONSE_TEMPLATE.error(error.code, error.message, error.details),
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      API_RESPONSE_TEMPLATE.error("INTERNAL_ERROR", "RAG search failed"),
      { status: 500 }
    );
  }
}

// POST endpoint to upload and index documents
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        API_RESPONSE_TEMPLATE.error("AUTH_ERROR", "Unauthorized"),
        { status: 401 }
      );
    }

    const body = await req.json();
    const { content, filename } = body;

    if (!content || !filename) {
      return NextResponse.json(
        API_RESPONSE_TEMPLATE.error(
          "VALIDATION_ERROR",
          "Content and filename are required"
        ),
        { status: 400 }
      );
    }

    logger.info("Document upload initiated", { userId, filename });

    // Check if Gemini API is configured
    if (!process.env.GEMINI_API_KEY) {
      logger.error("GEMINI_API_KEY not found in environment");
      return NextResponse.json(
        API_RESPONSE_TEMPLATE.error(
          "CONFIG_ERROR",
          "Gemini API key is not configured. Please add GEMINI_API_KEY to your .env.local file and restart the server."
        ),
        { status: 503 }
      );
    }

    await connectDB();

    // Generate embedding for the document
    const embedding = await geminiService.generateEmbedding(content);

    // Save document to database
    const doc = await Document.create({
      content,
      metadata: {
        source: "uploaded",
        filename,
        uploadedBy: userId,
      },
      embedding,
    });

    logger.info("Document indexed successfully", {
      userId,
      filename,
      docId: doc._id,
    });

    return NextResponse.json(
      API_RESPONSE_TEMPLATE.success({
        id: doc._id,
        filename,
        indexed: true,
      }),
      { status: 201 }
    );
  } catch (error) {
    logger.error("Document upload failed", error);

    if (isAppError(error)) {
      return NextResponse.json(
        API_RESPONSE_TEMPLATE.error(error.code, error.message, error.details),
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      API_RESPONSE_TEMPLATE.error(
        "INTERNAL_ERROR",
        "Document upload failed"
      ),
      { status: 500 }
    );
  }
}
