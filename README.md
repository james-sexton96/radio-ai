# Radio-AI: Radiology Image Chat Assistant

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Ollama

This app requires [Ollama](https://ollama.com/) to run locally for AI model inference. Download and install Ollama from [https://ollama.com/download](https://ollama.com/download) and follow the instructions for your operating system.

After installation, start Ollama:

```bash
ollama serve
```

Test that Ollama is running by visiting [http://localhost:11434](http://localhost:11434) in your browser or running:

```bash
curl http://localhost:11434
```

You should see a JSON response.

### 3. Download the Required Model

By default, this app uses the `gemma3:12b-it-qat` model (see `src/app/page.tsx`). You must pull this model with Ollama:

```bash
ollama pull gemma3:12b-it-qat
```

If you want to use a different model, set the `NEXT_PUBLIC_OLLAMA_MODEL` environment variable in a `.env.local` file.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to use the app.

## Usage

1. **Upload a radiology image** (X-ray, CT, MRI, etc.).
2. **Ask a question** about the image in the chat interface.
3. The AI will analyze the image and respond using the selected model.

## Configuration

- **Model:** Default is `gemma3:12b-it-qat`. Change with `NEXT_PUBLIC_OLLAMA_MODEL`.
- **Ollama API URL:** Default is `http://localhost:11434/api/generate`. Change with `NEXT_PUBLIC_OLLAMA_API_URL`.

## Learn More

- [Ollama Documentation](https://ollama.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
