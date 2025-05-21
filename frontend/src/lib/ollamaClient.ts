// ollamaClient.ts
// Client for interacting with the Next.js LLM API route

export async function askLlm(prompt: string, model: string) {
  console.log('Sending request to LLM API:', { prompt, model });
  const response = await fetch('/api/llm/interact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, model }),
  });
  console.log('Received response from LLM API:', response);
  if (!response.ok) {
    throw new Error('Failed to get response from LLM API');
  }
  const jsonResponse = await response.json();
  console.log('Parsed JSON response:', jsonResponse);
  return jsonResponse;
}

export async function askLlmStream(
  prompt: string,
  model: string,
  onMessage: (message: string) => void
) {
  console.log('Sending streaming request to LLM API:', { prompt, model });
  const response = await fetch('/api/llm/interact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, model }),
  });

  if (!response.ok || !response.body) {
    throw new Error('Failed to get response from LLM API');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      // Decode the chunk and add it to our buffer
      buffer += decoder.decode(value, { stream: true });

      // Find newline characters
      const lines = buffer.split('\n');

      // Process all complete lines
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          const data = JSON.parse(line);
          if (data.response) {
            onMessage(data.response);
          }
        } catch (error) {
          console.error('Error parsing JSON chunk:', line, error);
        }
      }

      // Keep the last (potentially incomplete) line in the buffer
      buffer = lines[lines.length - 1];
    }

    // Process any remaining buffer content
    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer);
        if (data.response) {
          onMessage(data.response);
        }
      } catch (error) {
        console.error('Error parsing final JSON chunk:', buffer, error);
      }
    }
  } catch (error) {
    console.error('Stream processing error:', error);
    throw error;
  }
}
