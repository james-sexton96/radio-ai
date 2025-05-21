// File: frontend/src/app/api/llm/interact/route.ts
import { NextRequest, NextResponse } from 'next/server';

// The base URL for the Ollama service, retrieved from environment variables.
// This should be 'http://llm_service:11434' when running within Docker Compose.
const OLLAMA_API_BASE_URL = process.env.OLLAMA_INTERNAL_URL;

/**
 * Handles POST requests to interact with the LLM.
 * Expects a JSON body with "prompt" and "model".
 * Forwards the request to the Ollama service and returns its response.
 */
export async function POST(request: NextRequest) {
  // Check if the Ollama URL is configured
  if (!OLLAMA_API_BASE_URL) {
    console.error("OLLAMA_INTERNAL_URL is not set in environment variables.");
    return NextResponse.json(
      { error: "LLM service is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    // Parse the request body from the client
    const body = await request.json();
    const { prompt, model } = body;

    // Validate that prompt and model are provided
    if (!prompt || !model) {
      return NextResponse.json(
        { error: "Missing 'prompt' or 'model' in request body." },
        { status: 400 }
      );
    }

    console.log(`Forwarding request to Ollama: model='${model}', prompt='${prompt.substring(0, 50)}...'`);

    // Construct the request to the Ollama service
    // For text-only, non-streamed interaction:
    const ollamaResponse = await fetch(`${OLLAMA_API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: true, // Enable streaming response from Ollama
      }),
    });

    // Stream the response back to the client
    const { readable, writable } = new TransformStream();
    ollamaResponse.body?.pipeTo(writable);
    return new NextResponse(readable, {
      headers: ollamaResponse.headers,
    });

  } catch (error: unknown) { // Changed 'any' to 'unknown'
    console.error("Error in /api/llm/interact:", error);
    let errorMessage = "An unexpected error occurred.";

    if (error instanceof Error) { // Type check
        errorMessage = error.message;
    }
    
    // Check if it's a TypeError from await request.json() failing (e.g. empty or non-JSON body)
    // Need to be careful with instanceof checks for DOMException or other specific fetch-related errors if applicable
    if (error instanceof TypeError && (error.message.includes("ReadableStream body is already read") || error.message.toLowerCase().includes("json"))) {
        errorMessage = "Invalid request body. Expected JSON.";
        return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: "An internal server error occurred processing your request.", details: errorMessage },
      { status: 500 }
    );
  }
}
