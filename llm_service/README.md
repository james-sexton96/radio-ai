# LLM Service

This directory contains the Dockerized setup for the Ollama-compatible multimodal LLM service.

## Instructions for Pulling Models

To ensure the `gemma3:27b-it-qat` model is available for use, follow these steps:

1. Start the `llm_service` container using Docker Compose:
   ```powershell
   docker-compose up -d llm_service
   ```

2. Once the service is running, manually pull the required model by executing the following command:
   ```powershell
   docker-compose exec llm_service ollama pull gemma3:27b-it-qat
   ```

3. Verify that the model has been successfully pulled and is ready for use.

## Notes

- The `RUN ollama pull` command has been removed from the `Dockerfile` to avoid build-time dependencies on the Ollama app.
- Models can also be pulled automatically by Ollama on first use if not present.
