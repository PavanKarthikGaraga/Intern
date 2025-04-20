# ----------- Builder Stage ------------
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# ----------- Production Stage ------------
FROM node:20-alpine

WORKDIR /app

# Only copy necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/.next .next
COPY --from=builder /app/public public
COPY --from=builder /app/node_modules node_modules

EXPOSE 3000
CMD ["npm", "start"]
