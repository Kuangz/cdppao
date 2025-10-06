# --- Build frontend ---
FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ติดตั้งตาม lockfile
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# คัดลอกซอร์สและ build
COPY frontend/ .
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm run build

# --- Serve with Nginx ---
FROM nginx:alpine
# คอนฟิก nginx ของคุณ
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# รองรับทั้ง Vite(dist) และ CRA(build)
# ถ้ามี dist จะถูกคัดลอก; ถ้าไม่มี dist แต่มี build ก็จะถูกคัดลอก
COPY --from=build /app/dist/ /usr/share/nginx/html/
# COPY --from=build /app/build/ /usr/share/nginx/html/
