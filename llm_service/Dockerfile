# Use the official Ollama image as the base
FROM ollama/ollama:latest

# Ollama's base image already sets up the necessary entrypoint and default command
# to start the Ollama service. It also exposes port 11434.

# For this MVP, we don't need to pre-pull models directly in the Dockerfile build
# as it can significantly increase build time and image size.
# Models will be pulled either manually via `docker-compose exec` or
# automatically by Ollama on first use if not present.

# For now, a simple FROM statement is sufficient.
# The service will be configured further via docker-compose.yml.

# Removed the `RUN ollama pull` command to avoid build-time dependency on the running Ollama app
