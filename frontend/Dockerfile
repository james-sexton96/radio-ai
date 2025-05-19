# Stage 1: Install dependencies and build the application
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./
# If using yarn, uncomment the next line and comment out the npm install line
# COPY yarn.lock ./

# Install dependencies
# If using yarn, change to: RUN yarn install --frozen-lockfile
RUN npm install

# Copy the rest of the application files
COPY . .

# Set NEXT_TELEMETRY_DISABLED to 1 to disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

# Build the Next.js application
RUN npm run build

# Stage 2: Production image - copy built app from builder stage
FROM node:20-alpine

WORKDIR /app

# Copy built assets from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
# If you have a standalone output (next.config.js output: 'standalone'),
# you'd copy /app/.next/standalone and /app/.next/static instead.
# For a standard build, .next and public are key. package.json is needed for `npm start`.

# Install production dependencies (if any not bundled with .next, though `npm start` needs `next`)
# We need 'next' to be available to run `npm start` which typically calls `next start`
# A full `npm install --omit=dev` might be safer if there are runtime dependencies not in .next
# For now, let's assume `next` is the main one.
# If your `create-next-app` included `next` as a regular dependency, this should be fine.
# If `next` is only a devDependency, `npm start` might fail.
# Let's ensure `next` is available for `npm start`.
# We can copy the node_modules from the builder stage that are needed for production,
# or run npm install --omit=dev here. Copying is often faster if dependencies are compatible.
COPY --from=builder /app/node_modules ./node_modules


# Expose port 3000
EXPOSE 3000

# Set NEXT_TELEMETRY_DISABLED to 1 to disable Next.js telemetry during runtime
ENV NEXT_TELEMETRY_DISABLED 1

# Command to start the Next.js application
# This will use the `start` script from your `package.json`, which is typically "next start"
CMD ["npm", "start"]
