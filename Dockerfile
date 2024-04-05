FROM golang:1.18-alpine as builder

WORKDIR /app

ENV CGO_ENABLED=0

RUN go install go.k6.io/xk6/cmd/xk6@latest

# Your extension's GitHub URL, I used mine as an example
RUN xk6 build --with github.com/szkiba/xk6-dashboard@latest

# Stage 1: Build the application
FROM node:16-alpine

RUN apk update && apk add --no-cache \
    ca-certificates

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

COPY --from=builder /app/k6 /bin/


# Expose any necessary ports
EXPOSE 8080


# Start the application
CMD [ "npm", "start" ]
