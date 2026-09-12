FROM golang:1.23-alpine AS builder
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -mod=vendor -o /out/server .
FROM alpine:3.20
WORKDIR /app
COPY --from=builder /out/server ./server
COPY data ./data
EXPOSE 8080
CMD ["./server"]
