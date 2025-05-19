# MVP Build Plan: Neuroradiology AI Assistant

This document outlines a granular, step-by-step plan for building the Minimum Viable Product (MVP) of the Neuroradiology AI Assistant. Each task is designed to be small, testable, focus on a single concern, and build upon previous tasks.

## Phase 1: Project Setup & Foundational Services

**Goal:** Establish the basic project structure, Docker orchestration, and a running Pocketbase instance with an initial schema.

* **Task 1.1: Initialize Git Repository**
    * **Action:** Create a new Git repository for the project.
    * **End:** Repository created with an initial commit (e.g., a README or .gitignore).
    * **Test:** `git status` shows a clean working tree.

* **Task 1.2: Create Root Project Directory and Initial Subdirectories**
    * **Action:** Create the root project directory (`neurorad-ai-assistant`) and the primary subdirectories: `frontend`, `pocketbase`, `llm_service`.
    * **End:** Directory structure exists.
    * **Test:** Verify directories are present using `ls` or a file explorer.

* **Task 1.3: Create Initial `docker-compose.yml`**
    * **Action:** Create `docker-compose.yml` at the project root. Define basic service stubs for `frontend`, `pocketbase`, and `llm_service`. Use placeholder image names for now if specific Dockerfiles aren't ready (e.g., `alpine` for `frontend` and `llm_service`, `pocketbaseio/pocketbase:latest` for `pocketbase`).
    * **End:** `docker-compose.yml` file created with service definitions.
    * **Test:** `docker-compose config` runs without errors.

* **Task 1.4: Create Basic `Dockerfile` for Pocketbase**
    * **Action:** In the `pocketbase/` directory, create a `Dockerfile`. It can be as simple as `FROM pocketbaseio/pocketbase:latest`. This allows for future customizations (e.g., adding `pb_migrations` or custom hooks).
    * **End:** `pocketbase/Dockerfile` is created.
    * **Test:** `docker build ./pocketbase` completes successfully (optional at this stage, will be tested with compose).

* **Task 1.5: Create Pocketbase Data Directories**
    * **Action:** Create `pocketbase/pb_data` and `pocketbase/pb_migrations` directories.
    * **End:** Directories exist.
    * **Test:** Verify directories are present.

* **Task 1.6: Configure Pocketbase Service in `docker-compose.yml`**
    * **Action:** Update the `pocketbase` service definition in `docker-compose.yml`:
        * Use `build: ./pocketbase` instead of `image`.
        * Map port `8090:8090`.
        * Mount `./pocketbase/pb_data:/pb_data` as a volume for persistence.
        * Mount `./pocketbase/pb_migrations:/pb_migrations` as a volume.
    * **End:** `docker-compose.yml` updated for Pocketbase.
    * **Test:** `docker-compose config` runs without errors.

* **Task 1.7: Start and Test Pocketbase Service**
    * **Action:** Run `docker-compose up pocketbase -d --build`.
    * **End:** Pocketbase container is running.
    * **Test:** Access the Pocketbase admin UI in a browser at `http://localhost:8090/_/`. Create an admin account.

* **Task 1.8: Define Initial Pocketbase Collections via Admin UI**
    * **Action:** Using the Pocketbase Admin UI:
        * The `users` collection is default.
        * Create `images` collection (e.g., add a `filename` text field, `userId` relation to `users`).
        * Create `chat_sessions` collection (e.g., add a `userId` relation to `users`, `imageId` relation to `images` (optional for now)).
        * Create `chat_messages` collection (e.g., add a `sessionId` relation to `chat_sessions`, `sender` text field, `content` text field).
        * Create `reports` collection (e.g., add a `sessionId` relation to `chat_sessions`, `markdownContent` text field).
    * **End:** Collections are created in Pocketbase.
    * **Test:** Verify all collections and their basic fields exist in the Pocketbase Admin UI.

## Phase 2: Basic Next.js Frontend Setup

**Goal:** Get a basic Next.js application running within Docker, accessible from the browser.

* **Task 2.1: Initialize Next.js Application**
    * **Action:** Navigate to the `frontend/` directory. Initialize a new Next.js application using `npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*"`. (Adjust flags as per `create-next-app` version).
    * **End:** Next.js project files are created in `frontend/`.
    * **Test:** `cd frontend && npm run dev` starts the Next.js dev server successfully. Access `http://localhost:3000`.

* **Task 2.2: Create `Dockerfile` for Frontend Service**
    * **Action:** In the `frontend/` directory, create a `Dockerfile`:
        * Use a Node.js base image (e.g., `node:20-alpine`).
        * Set working directory.
        * Copy `package.json`, `package-lock.json` (or `yarn.lock`).
        * Install dependencies (`npm install` or `yarn install`).
        * Copy the rest of the application files.
        * Build the Next.js app (`npm run build`).
        * Expose port 3000.
        * Set `CMD ["npm", "start"]`.
    * **End:** `frontend/Dockerfile` is created.
    * **Test:** `docker build ./frontend` completes successfully (optional, will be tested with compose).

* **Task 2.3: Update `docker-compose.yml` for Frontend Service**
    * **Action:** Update the `frontend` service definition in `docker-compose.yml`:
        * Use `build: ./frontend`.
        * Map port `3000:3000`.
        * Set up a volume for `node_modules` if needed for development hot-reloading with local `npm run dev` (e.g. `./frontend:/app` and `/app/node_modules` anonymous volume). For production build, this is not strictly necessary. Let's assume a build step for now.
        * Ensure it depends on `pocketbase` (optional, but good practice).
    * **End:** `docker-compose.yml` updated for the frontend.
    * **Test:** `docker-compose config` runs without errors.

* **Task 2.4: Create a Simple "Hello World" Page in Next.js**
    * **Action:** Modify `frontend/app/page.tsx` to display a simple "Hello Neurorad AI" message.
    * **End:** `page.tsx` is updated.
    * **Test:** (Will be tested when services are up).

* **Task 2.5: Start All Services and Test Frontend**
    * **Action:** Run `docker-compose up --build -d`.
    * **End:** All services (frontend, pocketbase) are running.
    * **Test:** Access the Next.js "Hello Neurorad AI" page in a browser at `http://localhost:3000`.

## Phase 3: Pocketbase Client & Basic Authentication (Frontend)**

**Goal:** Enable user signup and login functionality in the Next.js app using Pocketbase.

* **Task 3.1: Install Pocketbase JS SDK in Frontend**
    * **Action:** In the `frontend/` directory, run `npm install pocketbase` (or `yarn add pocketbase`).
    * **End:** Pocketbase SDK is added as a dependency.
    * **Test:** `package.json` lists `pocketbase`.

* **Task 3.2: Create Pocketbase Client Initialization**
    * **Action:** Create `frontend/lib/pocketbase.ts`. Initialize and export a Pocketbase client instance. The server URL should be `http://pocketbase:8090` (service name from `docker-compose.yml` for inter-container communication). For client-side usage, it might need to be `http://localhost:8090` if Next.js is making requests from the browser during development. For API routes, `http://pocketbase:8090` is correct.
        ```typescript
        // frontend/lib/pocketbase.ts
        import PocketBase from 'pocketbase';
        export const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || '[http://127.0.0.1:8090](http://127.0.0.1:8090)');
        // Add NEXT_PUBLIC_POCKETBASE_URL=[http://127.0.0.1:8090](http://127.0.0.1:8090) to .env.local for client-side
        // For server-side (API routes), you might need a different URL if running in Docker:
        // export const pbServer = new PocketBase('http://pocketbase:8090');
        ```
        *Note: Handle client-side vs server-side PB client instantiation carefully. For now, a single client pointing to `http://127.0.0.1:8090` (assuming PocketBase port is mapped to host) is fine for initial setup.*
    * **End:** `pocketbase.ts` created.
    * **Test:** Code compiles.

* **Task 3.3: Create Basic Signup and Login UI Components**
    * **Action:**
        * Create `frontend/components/auth/SignupForm.tsx` with email, password, and passwordConfirm fields, and a submit button.
        * Create `frontend/components/auth/LoginForm.tsx` with email and password fields, and a submit button.
        * (No functionality yet, just the JSX structure).
    * **End:** Components created.
    * **Test:** Components can be imported and rendered on a test page without errors.

* **Task 3.4: Create Signup and Login Pages**
    * **Action:**
        * Create `frontend/app/(auth)/signup/page.tsx` and import/use `SignupForm`.
        * Create `frontend/app/(auth)/login/page.tsx` and import/use `LoginForm`.
    * **End:** Pages created.
    * **Test:** Navigate to `/signup` and `/login` in the browser. Forms should render.

* **Task 3.5: Implement Signup Functionality**
    * **Action:** In `SignupForm.tsx`, add state for form fields. On submit, call `pb.collection('users').create({ email, password, passwordConfirm })`. Provide basic UI feedback (e.g., `alert` or `console.log` success/error).
    * **End:** Signup logic implemented.
    * **Test:** Create a new user via the signup form. Verify the user appears in the Pocketbase Admin UI under the `users` collection.

* **Task 3.6: Implement Login Functionality & Basic Auth Context**
    * **Action:**
        * Create `frontend/contexts/AuthContext.tsx`. Implement a simple context to store `user`, `token`, `login`, `logout`, `isAuthenticated`.
        * In `LoginForm.tsx`, add state for form fields. On submit, call `pb.collection('users').authWithPassword(email, password)`.
        * On successful login, update the `AuthContext` with user data and token. Store `pb.authStore.exportToCookie()` or manage token.
    * **End:** Login logic and basic AuthContext implemented.
    * **Test:** Log in with the created user. `console.log` user data or token.

* **Task 3.7: Wrap App with AuthProvider and Implement Logout**
    * **Action:**
        * Wrap `frontend/app/layout.tsx`'s children with the `AuthProvider` from `AuthContext.tsx`.
        * Implement a `logout` function in `AuthContext` that calls `pb.authStore.clear()` and clears local user state.
        * Add a temporary "Logout" button somewhere visible after login (e.g., on the main page if login is successful).
    * **End:** AuthProvider setup and logout implemented.
    * **Test:** User can sign up, log in. After login, user data is available in context. User can log out, and context is cleared.

## Phase 4: Protected Routes & Basic Dashboard Layout

**Goal:** Create a dashboard page accessible only to authenticated users.

* **Task 4.1: Implement Protected Route Logic**
    * **Action:** Create a main application layout `frontend/app/(app)/layout.tsx`. This layout should use the `AuthContext` to check if the user is authenticated. If not, redirect to `/login` (e.g., using `useRouter` from `next/navigation` in a client component wrapper or in middleware).
    * **End:** Protected route layout created.
    * **Test:** Attempting to access a route under `(app)` while unauthenticated redirects to `/login`.

* **Task 4.2: Create Basic Dashboard Page**
    * **Action:** Create `frontend/app/(app)/dashboard/page.tsx`. Display a simple "Welcome, [user.email]" message, fetching user from `AuthContext`.
    * **End:** Dashboard page created.
    * **Test:** Authenticated users can access `/dashboard` and see their email.

* **Task 4.3: Design Basic Dashboard Layout**
    * **Action:** In `frontend/app/(app)/dashboard/page.tsx`, add placeholder sections using basic HTML/Tailwind for:
        * An area for image display/upload.
        * An area for chat messages.
        * An input field for chat.
    * **End:** Basic visual structure for the dashboard is in place.
    * **Test:** View the dashboard page; placeholder sections are visible.

## Phase 5: Basic LLM Service Setup (Text-Only Model First)

**Goal:** Get the Ollama service running in Docker with a basic text model.

* **Task 5.1: Create `llm_service/Dockerfile`**
    * **Action:** Create `llm_service/Dockerfile`.
        ```dockerfile
        FROM ollama/ollama:latest
        # Optionally, pre-pull a model to speed up first run, e.g., phi3 for text-only start
        # RUN ollama pull phi3
        EXPOSE 11434
        ```
        *Note: If `RUN ollama pull` doesn't work directly in Dockerfile build phase due to service not running, the model will be pulled on first use or via an entrypoint script.*
    * **End:** `llm_service/Dockerfile` created.
    * **Test:** `docker build ./llm_service` completes.

* **Task 5.2: Update `docker-compose.yml` for `llm_service`**
    * **Action:** Configure the `llm_service` in `docker-compose.yml`:
        * `build: ./llm_service`
        * Map port `11434:11434`.
        * (Optional) Add `deploy: resources: reservations: devices: - driver: nvidia capabilities: [gpu] count: 1` if GPU is available and desired.
    * **End:** `docker-compose.yml` updated.
    * **Test:** `docker-compose config` is valid.

* **Task 5.3: Start and Test `llm_service`**
    * **Action:** Run `docker-compose up llm_service -d --build`. After it starts, manually pull a model if not done in Dockerfile: `docker-compose exec llm_service ollama pull phi3` (or chosen text model).
    * **End:** `llm_service` is running with a model.
    * **Test:** `curl http://localhost:11434/api/tags` (from host) should list available models (e.g., `phi3`). `curl -X POST http://localhost:11434/api/generate -d '{ "model": "phi3", "prompt": "Why is the sky blue?" }'` should return a response.

## Phase 6: Next.js API Route for LLM Interaction (Text-Only)

**Goal:** Create a Next.js API route that proxies requests to the Ollama service.

* **Task 6.1: Create Next.js API Route for LLM**
    * **Action:** Create the file `frontend/app/api/llm/interact/route.ts`.
    * **End:** File created.
    * **Test:** N/A (code will be added next).

* **Task 6.2: Implement POST Handler for Text-Only LLM Interaction**
    * **Action:** In `frontend/app/api/llm/interact/route.ts`:
        * Implement a `POST` request handler.
        * It should expect a JSON body like `{ "prompt": "some text", "model": "phi3" }`.
        * Make an HTTP POST request to the Ollama service: `http://llm_service:11434/api/generate` (using the service name for inter-container communication).
        * Stream or return the LLM's response (for simplicity, start with non-streamed, aggregated response).
        * Ensure proper error handling.
    * **End:** API route implemented.
    * **Test:** Use Postman or `curl` to send a request to `http://localhost:3000/api/llm/interact` with a JSON payload `{"prompt": "Hello", "model": "phi3"}`. Expect a JSON response from the LLM.

* **Task 6.3: Create Frontend Library Function for LLM API**
    * **Action:** Create `frontend/lib/ollamaClient.ts` (or add to an existing client lib). Add a function `askLlm(prompt: string, model: string)` that calls the `/api/llm/interact` Next.js endpoint.
    * **End:** Client library function created.
    * **Test:** Code compiles. Can be manually called from a test component/page to verify.

## Phase 7: Basic Chat UI & Text-Only Interaction

**Goal:** Connect the dashboard's chat input to the LLM service for text-based conversation.

* **Task 7.1: Create Basic Chat Message Components**
    * **Action:**
        * `frontend/components/chat/ChatMessage.tsx`: Takes props like `sender: 'user' | 'ai'`, `text: string` and displays them.
        * `frontend/components/chat/ChatInput.tsx`: A controlled text input field and a "Send" button. Calls a provided `onSendMessage` prop.
    * **End:** Components created.
    * **Test:** Components render correctly with sample props.

* **Task 7.2: Integrate Chat Components into Dashboard**
    * **Action:** On `frontend/app/(app)/dashboard/page.tsx`:
        * Add state to hold an array of chat messages: `const [messages, setMessages] = useState<{sender: string, text: string}[]>([]);`
        * Render the `messages` array using `ChatMessage`.
        * Add the `ChatInput` component.
    * **End:** Chat UI structure in place on the dashboard.
    * **Test:** Dashboard displays an empty chat area and an input field.

* **Task 7.3: Implement Chat Message Sending (Text-Only)**
    * **Action:** In `frontend/app/(app)/dashboard/page.tsx`:
        * Implement the `handleSendMessage(text: string)` function for `ChatInput`.
        * When a message is sent:
            1.  Add user's message to `messages` state: `{ sender: 'user', text }`.
            2.  Call the `askLlm` function from `frontend/lib/ollamaClient.ts` with the user's text and the chosen text model (e.g., "phi3").
            3.  Add AI's response to `messages` state: `{ sender: 'ai', text: llmResponse }`.
            4.  Handle loading states and errors.
    * **End:** Chat functionality implemented.
    * **Test:** User can type a message in `ChatInput`, press send. The user's message appears, then the LLM's text response appears in the chat display.

## Phase 8: Image Upload and Display (Frontend)

**Goal:** Allow users to upload an image and see a preview on the dashboard.

* **Task 8.1: Create `ImageUploader` Component**
    * **Action:** Create `frontend/components/core/ImageUploader.tsx`.
        * Use `<input type="file" accept="image/*" />`.
        * On file selection, call an `onImageSelect(file: File)` prop.
    * **End:** `ImageUploader` component created.
    * **Test:** Component renders, file dialog opens on click.

* **Task 8.2: Integrate `ImageUploader` into Dashboard**
    * **Action:** Add `ImageUploader` to `frontend/app/(app)/dashboard/page.tsx`.
    * Add state to hold the selected image file: `const [selectedImage, setSelectedImage] = useState<File | null>(null);`
    * Add state to hold the image preview URL: `const [imagePreview, setImagePreview] = useState<string | null>(null);`
    * Implement `handleImageSelect(file: File)`:
        * Set `selectedImage(file)`.
        * Create an object URL for preview: `setImagePreview(URL.createObjectURL(file))`.
        * Clean up object URL when component unmounts or image changes: `URL.revokeObjectURL()`.
    * **End:** Image uploader integrated.
    * **Test:** User can click the uploader, select an image file.

* **Task 8.3: Display Image Preview**
    * **Action:** In the dashboard's image display area, if `imagePreview` is set, render an `<img>` tag with `src={imagePreview}`.
    * **End:** Image preview is displayed.
    * **Test:** After selecting an image, its preview is shown on the dashboard.

## Phase 9: Multimodal LLM Interaction

**Goal:** Send both image and text to the LLM service.

* **Task 9.1: Ensure Multimodal LLM Service is Ready**
    * **Action:**
        * Update `llm_service/Dockerfile` or ensure `ollama pull llava` (or chosen multimodal model, e.g., `llava:latest`) is run.
        * Restart `llm_service`: `docker-compose up -d --build llm_service`.
        * Verify the multimodal model is available: `docker-compose exec llm_service ollama list` or `curl http://localhost:11434/api/tags`.
    * **End:** Multimodal LLM (e.g., `llava`) is running and available in Ollama.
    * **Test:** `curl http://localhost:11434/api/tags` lists `llava`. Test `llava` with a simple text prompt via `/api/generate` to ensure it's working.

* **Task 9.2: Modify Next.js API Route for Multimodal Input**
    * **Action:** In `frontend/app/api/llm/interact/route.ts`:
        * Modify the POST handler to accept an optional `imageData` (e.g., base64 string) in the JSON body: `{ "prompt": "text", "model": "llava", "imageData": "base64string..." }`.
        * If `imageData` is present, construct the request to Ollama's `/api/generate` endpoint to include the image. For `llava`, this is typically an array in the `images` field of the request body: `images: [imageData]`.
    * **End:** API route updated for multimodal requests.
    * **Test:** Use Postman or `curl` to send a request to `http://localhost:3000/api/llm/interact` with `prompt`, `model: "llava"`, and a sample base64 `imageData`. Expect a response from `llava` that considers the (dummy) image.

* **Task 9.3: Update Frontend to Send Image Data**
    * **Action:** In `frontend/app/(app)/dashboard/page.tsx`'s `handleSendMessage`:
        * If `selectedImage` exists:
            * Convert `selectedImage` (File object) to a base64 string.
            * When calling `askLlm` (or the underlying fetch to `/api/llm/interact`), include the `imageData` and specify the multimodal model name (e.g., "llava").
        * Modify `frontend/lib/ollamaClient.ts`'s `askLlm` function to accept optional `imageData`.
    * **End:** Frontend chat sends image data when available.
    * **Test:** Upload an image on the dashboard. Type a question about the image (e.g., "What do you see in this image?"). The LLM's response should be relevant to the image content.

## Phase 10: Storing Chat History & Sessions in Pocketbase

**Goal:** Persist chat interactions in Pocketbase.

* **Task 10.1: Logic to Create/Get Chat Session**
    * **Action:** In `frontend/app/(app)/dashboard/page.tsx` (or a custom hook):
        * Add state for `currentSessionId: string | null`.
        * When an image is first uploaded and/or the first message is sent for that image, create a new record in the `chat_sessions` collection in Pocketbase. Fields: `userId` (from AuthContext), `imageId` (if applicable, TBD how image files are stored/referenced long-term, for now, maybe just a flag or skip `imageId`), `createdAt`. Store the new session ID in `currentSessionId`.
        * If a session is ongoing, use the `currentSessionId`.
    * **End:** Session creation/management logic started.
    * **Test:** After starting a new chat (e.g., after image upload), a new record appears in `chat_sessions` in Pocketbase.

* **Task 10.2: Save Chat Messages to Pocketbase**
    * **Action:** Modify `frontend/app/api/llm/interact/route.ts` (or do this client-side after receiving LLM response, though API route is better for atomicity):
        * After receiving the user's prompt and before/after getting the LLM's response, save both to the `chat_messages` collection in Pocketbase.
        * Each message record should include `sessionId` (from `currentSessionId`), `sender` ('user' or 'ai'), `content` (the text).
    * **End:** Chat messages are saved.
    * **Test:** After a chat interaction, verify new records in `chat_messages` linked to the correct `chat_session` in Pocketbase.

* **Task 10.3: Load Chat History on Dashboard Load (for current/last session)**
    * **Action:** In `frontend/app/(app)/dashboard/page.tsx`:
        * On component mount, if there's a concept of a "current" or "last active" session (e.g., stored in localStorage or fetched as latest for user), attempt to load its messages from Pocketbase and populate the `messages` state.
        * (For MVP, this can be simplified to just showing messages for the session started on this page load).
    * **End:** Basic chat history loading.
    * **Test:** Refreshing the dashboard (if session ID is persisted somehow) or re-navigating might show previous messages of an "active" session.

## Phase 11: System Prompt for Report Generation

**Goal:** Guide the LLM to generate structured Markdown reports.

* **Task 11.1: Create `system_prompt.md`**
    * **Action:** Create `frontend/system_prompt.md` (or in `llm_service/` if that service handles it). Content:
        ```markdown
        You are a helpful Neuroradiology AI assistant. Your role is to analyze medical images and related patient information.
        When interacting, identify potential clinical features, suggest relevant follow-up activities, and ask clarifying clinical questions to improve your analysis.
        List the top 3-5 most relevant follow-up activities.

        When specifically asked to "generate a report", structure your entire output in Markdown format as follows:

        ## Clinical Analysis
        [Provide a detailed analysis of the image and conversation context.]

        ## Potential Findings
        - [Finding 1]
        - [Finding 2]

        ## Suggested Follow-up Activities
        1. [Activity 1: Description]
        2. [Activity 2: Description]
        3. [Activity 3: Description]

        ## Clarifying Clinical Questions
        - [Question 1 regarding patient history/symptoms]
        - [Question 2 regarding specific image features]

        Ensure the report is comprehensive based on the preceding conversation and any provided image.
        ```
    * **End:** `system_prompt.md` created.
    * **Test:** File exists with content.

* **Task 11.2: Integrate System Prompt into LLM API Call**
    * **Action:** In `frontend/app/api/llm/interact/route.ts`:
        * Read the content of `system_prompt.md` (ensure this file is included in the Docker image for the `frontend` service, or pass it from client).
        * Prepend this system prompt to the conversation history/prompt sent to the Ollama API. Ollama's API usually has a dedicated `system` field in the request payload for this.
        ```json
        // Example Ollama payload
        {
          "model": "llava",
          "system": "Content of system_prompt.md here...",
          "prompt": "User's actual prompt",
          "images": ["base64image..."]
          // Potentially "messages": [{"role": "user", "content": "..."}] for conversational history
        }
        ```
    * **End:** System prompt is sent with each LLM request.
    * **Test:** Observe LLM responses. They should start aligning more with the assistant persona, ask questions, or suggest follow-ups even before a formal report is requested.

* **Task 11.3: Add "Generate Report" Button**
    * **Action:** Add a "Generate Report" button to `frontend/app/(app)/dashboard/page.tsx`.
    * **End:** Button is visible on the dashboard.
    * **Test:** Button renders.

* **Task 11.4: Implement Report Generation Request**
    * **Action:** When the "Generate Report" button is clicked:
        * Send a specific message to the LLM, like "Please generate a report based on our conversation and the image." This message will be processed by the LLM, which has already received the system prompt defining how to format reports.
        * The response from the LLM should (ideally) be the Markdown formatted report.
    * **End:** Report generation can be triggered.
    * **Test:** Click "Generate Report". The LLM's response text should be displayed. Check if it attempts to follow the Markdown structure defined in the system prompt.

## Phase 12: Storing and Displaying Reports

**Goal:** Save the generated Markdown report to Pocketbase and render it in the UI.

* **Task 12.1: Save Generated Report to Pocketbase**
    * **Action:** In the `handleSendMessage` or a dedicated report generation function in `frontend/app/(app)/dashboard/page.tsx` (or the API route):
        * After receiving the LLM's response to the "Generate Report" prompt, create a new record in the `reports` collection in Pocketbase.
        * Fields: `sessionId` (link to the current `chat_sessions` record), `markdownContent` (the LLM's response), `createdAt`, `generatedBy` (current user ID).
    * **End:** Reports are saved to Pocketbase.
    * **Test:** Generate a report. Verify a new record appears in the `reports` collection in Pocketbase with the Markdown content.

* **Task 12.2: Create `ReportDisplay` Component**
    * **Action:** Create `frontend/components/report/ReportDisplay.tsx`.
        * It takes a `markdownContent: string` prop.
        * Use a library like `react-markdown` (install it: `npm install react-markdown`) to render the Markdown string as HTML.
    * **End:** `ReportDisplay` component created.
    * **Test:** Pass a sample Markdown string to the component; it should render as formatted HTML.

* **Task 12.3: Display Generated Report on Dashboard**
    * **Action:** In `frontend/app/(app)/dashboard/page.tsx`:
        * Add state to hold the current report's Markdown: `const [reportMarkdown, setReportMarkdown] = useState<string | null>(null);`
        * After a report is successfully generated and its content is available (either directly from LLM or fetched after saving), set `reportMarkdown`.
        * Render the `ReportDisplay` component, passing `reportMarkdown` to it, if it's not null.
    * **End:** Generated report is displayed on the dashboard.
    * **Test:** Generate a report. The formatted report should appear on the dashboard below or alongside the chat.

## Phase 13: Basic Chat History Navigation (MVP)

**Goal:** Allow users to view a list of their past chat sessions and see their content.

* **Task 13.1: Create Basic History Page to List Sessions**
    * **Action:** Create `frontend/app/(app)/history/page.tsx`.
        * Fetch all `chat_sessions` for the currently logged-in user from Pocketbase.
        * Display them as a list (e.g., "Session created at [timestamp]" or "Session with Image [image_name_placeholder]").
        * Each item should link to a dynamic route for that session (e.g., `/history/[sessionId]`).
    * **End:** History page lists sessions.
    * **Test:** Navigate to `/history`. A list of the user's chat sessions from Pocketbase should be displayed.

* **Task 13.2: Create Dynamic Session View Page**
    * **Action:** Create `frontend/app/(app)/history/[sessionId]/page.tsx`.
        * This page will receive `sessionId` as a parameter.
        * Fetch the specific `chat_session` details from Pocketbase.
        * Fetch all `chat_messages` associated with this `sessionId`.
        * Fetch any `reports` associated with this `sessionId`.
    * **End:** Data fetching for individual session page implemented.
    * **Test:** Manually navigate to `/history/some_valid_session_id`. `console.log` fetched data.

* **Task 13.3: Display Session Details (Read-Only)**
    * **Action:** In `frontend/app/(app)/history/[sessionId]/page.tsx`:
        * Display the fetched chat messages in a read-only format (using `ChatMessage` component).
        * Display any fetched report (using `ReportDisplay` component).
        * Display image if associated and feasible for MVP.
    * **End:** Past session content is viewable.
    * **Test:** Click on a session from the `/history` page. The chat messages and any report for that session should be displayed in a read-only view.

This concludes the MVP task list. Each phase builds towards a functional application component.
