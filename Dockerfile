# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend
WORKDIR /app
COPY web/package*.json ./web/
WORKDIR /app/web
RUN npm ci
COPY web/ ./
RUN npm run build

# Stage 2: Build the Go backend
FROM golang:1.22-alpine AS backend
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Copy the built frontend assets into the expected directory for embedding
COPY --from=frontend /app/web/dist ./web/dist
# Build the binary as a static executable
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o tusk .

# Stage 3: Final minimal image
FROM gcr.io/distroless/static:nonroot
COPY --from=backend /app/tusk /tusk

EXPOSE 8080
ENTRYPOINT ["/tusk"]
CMD ["serve", "--address", "0.0.0.0", "--port", "8080"]
