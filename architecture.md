# Neuroradiology AI Assistant: System Architecture

This document outlines the architecture for a Neuroradiology AI assistant application. The system is designed to be self-contained using Docker, with a Next.js frontend, Pocketbase for the database and authentication, and an Ollama-compatible multimodal LLM for AI-driven analysis.

## 1. Core Concepts & High-Level Overview

The application will allow neuroradiologists (or other medical professionals) to:
1.  **Authenticate:** Securely log in to the system.
2.  **Upload Images:** Submit 2D medical images (e.g., MRI, CT scans).
3.  **Interact with AI:** Engage in a chat-like interface where the AI:
    * Analyzes the uploaded image.
    * Identifies potential clinical features.
    * Suggests follow-up activities.
    * Asks clarifying clinical questions about the patient.
4.  **Generate Reports:** Receive a structured Markdown report summarizing the interaction and findings.

**High-Level Flow:**

User (Browser) <--> Next.js Frontend <--> API Service (Next.js Backend Routes) <--> Pocketbase (DB/Auth)^|vAI Service (Ollama/LLM)
All these components will be containerized using Docker for portability and ease of deployment.

## 2. File and Folder Structure

Here's a proposed project structure:

neurorad-ai-assistant/
├── docker-compose.yml         # Defines and configures all services for Docker
├── .env.example               # Example environment variables
├── frontend/                  # Next.js Application
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Authentication-related routes (login, signup)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   ├── (app)/             # Main application routes (protected)
│   │   │   ├── layout.tsx     # Layout for authenticated routes
│   │   │   ├── dashboard/     # Main dashboard/image upload/chat interface
│   │   │   │   └── page.tsx
│   │   │   └── history/       # View past interactions/reports
│   │   │       └── [sessionId]/
│   │   │           └── page.tsx
│   │   ├── api/               # Next.js API Routes (BFF - Backend For Frontend)
│   │   │   ├── auth/          # Authentication endpoints (e.g., proxy to Pocketbase)
│   │   │   │   └── [..nextauth].ts # (Optional: if using NextAuth.js with Pocketbase)
│   │   │   ├── llm/           # Endpoints to interact with the AI service
│   │   │   │   └── interact/
│   │   │   │       └── route.ts
│   │   │   └── reports/       # Endpoints for managing reports
│   │   │       └── route.ts
│   │   └── global.css
│   ├── components/            # Reusable UI components
│   │   ├── auth/              # Auth-related components (LoginForm, SignupForm)
│   │   ├── chat/              # Chat interface components (ChatInput, ChatMessage)
│   │   ├── core/              # Core UI elements (Button, Modal, ImageUploader)
│   │   └── report/            # Report display components
│   ├── contexts/              # React Context for global state (e.g., AuthContext, ChatContext)
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions, API clients
│   │   ├── pocketbase.ts      # Pocketbase client setup
│   │   ├── ollama.ts          # Ollama client/interaction logic
│   │   └── utils.ts│   ├── public/                # Static assets (images, favicons)
│   ├── styles/                # Global styles (if not using Tailwind exclusively in components)
│   ├── next.config.js
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
├── pocketbase/                # Pocketbase Service
│   ├── pb_data/               # Pocketbase data (SQLite DB, logs) - volume mounted
│   ├── pb_migrations/         # Pocketbase database migrations
│   ├── Dockerfile             # To build a custom Pocketbase image if needed (e.g., with pre-defined schema)
│   └── hooks/                 # (Optional) Pocketbase JavaScript hooks for custom server-side logic
├── llm_service/               # AI Model Service (e.g., Ollama wrapper or custom service)
│   ├── Dockerfile             # Dockerfile to run Ollama or a custom Python service
│   ├── main.py                # (If custom) Python service (e.g., FastAPI) to interact with Ollama
│   ├── requirements.txt       # (If custom) Python dependencies
│   └── system_prompt.md       # System prompt for the LLM to guide report generation└── README.md

## 3. Component Breakdown

### 3.1. `frontend` (Next.js Application)

* **Purpose:** Provides the user interface and handles client-side logic. Acts as a Backend For Frontend (BFF) by having its API routes communicate with other services.
* **Key Responsibilities:**
    * User authentication (login, signup forms, session management).
    * Image uploading and display.
    * Interactive chat interface for AI interaction.
    * Rendering Markdown reports.
    * Making API calls to its own backend routes (`/api/...`) which then delegate to Pocketbase or the LLM service.
* **State Management:**
    * **Local Component State:** For UI elements, form inputs.
    * **React Context API / Zustand / Redux:** For global state like user authentication status, current chat session, loaded image data.
    * **Server-Side State (via API calls):** User data, chat history, reports are fetched from Pocketbase.
* **Key Technologies:** Next.js (App Router), React, TypeScript, Tailwind CSS.

### 3.2. `pocketbase` (Database & Authentication)

* **Purpose:** Provides a backend-as-a-service for database, real-time subscriptions, and user authentication.
* **Key Responsibilities:**
    * Storing user accounts and managing authentication (email/password, OAuth).
    * Storing patient information (if any, with HIPAA considerations if applicable).
    * Storing image metadata (not the raw images themselves, which might be stored elsewhere or passed directly).
    * Storing chat interaction history (prompts, AI responses).
    * Storing generated reports.
* **Data Schema (Collections - examples):**
    * `users`: Default Pocketbase collection.
    * `images`: (e.g., `filename`, `uploadedBy` (relation to `users`), `uploadTimestamp`, `contentType`).
    * `chat_sessions`: (e.g., `userId` (relation to `users`), `imageId` (relation to `images`), `createdAt`, `status`).
    * `chat_messages`: (e.g., `sessionId` (relation to `chat_sessions`), `sender` ("user" or "ai"), `content`, `timestamp`).
    * `reports`: (e.g., `sessionId` (relation to `chat_sessions`), `markdownContent`, `createdAt`, `generatedBy` (relation to `users`)).
* **Access:** Primarily accessed via the Next.js API routes. Direct client-side access from Next.js can be used for real-time features if needed, but mutations should go through the BFF.

### 3.3. `llm_service` (AI Model Interaction)

* **Purpose:** Hosts and interacts with the multimodal Large Language Model (e.g., Ollama).
* **Key Responsibilities:**
    * Receiving image data (or a reference/path to it) and text prompts from the Next.js backend.
    * Preprocessing the image if necessary for the LLM.
    * Sending the image and prompt (including the system prompt for report formatting) to the LLM.
    * Receiving the LLM's response.
    * Potentially post-processing the response before sending it back.
* **Implementation Options:**
    1.  **Direct Ollama:** If Ollama's API is sufficient and directly accessible within the Docker network. The Next.js backend would make HTTP requests to the Ollama container.
    2.  **Custom Python Service (e.g., FastAPI):** A lightweight Python service that acts as an intermediary. This provides more flexibility for:
        * Complex pre/post-processing.
        * Managing different LLM backends in the future.
        * Implementing custom logic around Ollama calls.
* **System Prompt:** A predefined text (`system_prompt.md`) will be included with every call to the LLM to instruct it on its role, the desired output format (Markdown report), the types of clinical questions to ask, and how to suggest follow-up activities.

### 3.4. `docker-compose.yml`

* **Purpose:** Defines and orchestrates the multi-container application.
* **Key Responsibilities:**
    * Defining services: `frontend`, `pocketbase`, `llm_service`.
    * Specifying Docker images to use (e.g., `node`, `ollama/ollama`, official Pocketbase image or custom).
    * Setting up network connections between services.
    * Defining environment variables for each service.
    * Configuring volume mounts for persistent data (e.g., `pocketbase/pb_data`).
    * Port mapping to expose the frontend to the host machine.

## 4. State Management & Service Connections

### 4.1. State Lives:

* **Frontend (Client-Side):**
    * UI State: Managed by React components (e.g., loading spinners, modal visibility, form inputs).
    * Global Client State: User authentication status, current chat messages, active image being analyzed (managed by React Context or a state management library like Zustand).
* **Next.js API Routes (Server-Side within Frontend service):**
    * Temporary state during request processing. No long-term state storage here.
* **Pocketbase (Persistent State):**
    * User accounts, roles, and permissions.
    * Image metadata and references.
    * Full chat history for each session.
    * Generated Markdown reports.
* **LLM Service (Mostly Stateless):**
    * Primarily stateless, processing requests as they come.
    * May cache models or have internal state related to the LLM runtime, but not application-specific session data.

### 4.2. Service Connections:

1.  **User -> Frontend (Next.js Browser App):**
    * User interacts with the React UI.
    * Forms are submitted, images uploaded.

2.  **Frontend (Browser App) -> Frontend (Next.js API Routes):**
    * Client-side code makes HTTP requests (e.g., `fetch` or `axios`) to its own API routes (`/api/...`).
    * Example: `/api/auth/login`, `/api/llm/interact`.

3.  **Frontend (Next.js API Routes) -> Pocketbase:**
    * API routes use the Pocketbase SDK (JavaScript) to:
        * Authenticate users.
        * Create, read, update, delete (CRUD) data in Pocketbase collections (users, images, chat_sessions, messages, reports).
    * Connection is typically over HTTP/S to the Pocketbase service endpoint within the Docker network (e.g., `http://pocketbase:8090`).

4.  **Frontend (Next.js API Routes) -> LLM Service:**
    * The `/api/llm/interact` route will:
        * Receive image data (or a path/URL) and user prompt.
        * Construct a request for the LLM service. This includes the user's message, the image, and the system prompt.
        * Make an HTTP request to the LLM service endpoint (e.g., `http://llm_service:8000/invoke` if it's a custom FastAPI service, or directly to Ollama's API endpoint).
        * Receive the LLM's response and relay it back to the client.

5.  **LLM Service -> Ollama (if separate):**
    * If `llm_service` is a custom wrapper, it communicates with the actual Ollama instance (likely via Ollama's HTTP API).

### 4.3. Data Flow Example (Image Analysis & Chat):

1.  **User Authentication:**
    * User enters credentials in Next.js frontend.
    * Frontend calls `/api/auth/login` (Next.js API route).
    * API route uses Pocketbase SDK to verify credentials against the `pocketbase` service.
    * Session token/cookie is returned to the frontend.
2.  **Image Upload:**
    * User uploads an image via the Next.js frontend.
    * Frontend sends the image (e.g., as `FormData`) to a Next.js API route (e.g., `/api/images/upload`).
    * The API route might:
        * Store metadata in Pocketbase (e.g., filename, uploader, timestamp).
        * For the image itself:
            * Option A (Simpler for local): Pass image data directly to the LLM service when needed.
            * Option B (More scalable): Store the image in a dedicated object storage (not covered by Pocketbase directly, could be a mounted volume or a separate service like MinIO if scaling up) and pass a reference. For simplicity with Pocketbase, it can store files up to a certain size, but this is less ideal for very large images or many users. Let's assume for now the image data is passed around or stored temporarily.
3.  **Chat Interaction:**
    * User types a message related to the uploaded image.
    * Frontend sends the message, image reference/data, and chat history to `/api/llm/interact`.
    * The API route:
        * Retrieves the `system_prompt.md`.
        * Constructs the full prompt for the LLM (system prompt + chat history + user message + image).
        * Sends this to the `llm_service`.
    * `llm_service` processes the request with the multimodal LLM (Ollama).
    * LLM response (analysis, questions, suggestions) is returned to the API route.
    * API route saves the user message and AI response in Pocketbase (`chat_messages` collection).
    * Response is sent back to the frontend to display in the chat.
4.  **Report Generation:**
    * The system prompt given to the `llm_service` will instruct the LLM to format its final comprehensive summary as a Markdown report.
    * This can be a specific user action ("Generate Report") or the LLM can be prompted to provide it at the end of a meaningful exchange.
    * The Markdown content is received by the Next.js API route.
    * The API route saves this report to the `reports` collection in Pocketbase, linked to the `chat_session`.
    * The frontend can then fetch and display this report.

## 5. Key Considerations

* **Security:**
    * Use HTTPS for all external communication.
    * Properly configure Pocketbase security rules to restrict data access.
    * Sanitize all inputs to prevent injection attacks.
    * Manage secrets (API keys, database credentials) using environment variables and Docker secrets.
* **HIPAA/Data Privacy (Crucial for Medical Data):**
    * If dealing with real Patient Health Information (PHI), all components and deployment environments must be HIPAA compliant. This is a significant undertaking involving specific security measures, audit trails, Business Associate Agreements (BAAs) with cloud providers, etc.
    * The current architecture is a general outline; for PHI, each component's handling of data would need rigorous review and potentially different choices (e.g., Pocketbase might not be suitable for PHI at scale without significant hardening and compliance efforts).
* **Scalability:**
    * Pocketbase, while convenient, runs as a single executable and SQLite database, which has limitations for very high concurrency. For larger scale, consider alternatives like PostgreSQL with a dedicated backend framework.
    * The LLM service might become a bottleneck. Consider solutions for scaling LLM inference if needed (e.g., multiple Ollama instances, dedicated GPU resources).
* **Error Handling:** Robust error handling is needed at each step of the process (UI, API routes, service communication).
* **Image Handling:** Decide on a strategy for storing and passing images. Passing raw image data in JSON payloads is inefficient for large images. Consider:
    * Storing images in a volume accessible by both Next.js and the LLM service.
    * Using a temporary storage mechanism.
    * Pocketbase can store files, but be mindful of its limits and performance for this use case.

This architecture provides a solid foundation for your Neuroradiology AI assistant. Remember to iterate and adapt as you build and encounter specific challenges.
This Markdown document outlines the proposed architecture. It covers the file structure, what each component does, where state resides, and how the services connect, all while adhering to your specified technology stack and requirements. It also includes important considerations for a real-world application of this nature.