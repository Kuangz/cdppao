
# FROM node:20.2.0-alpine AS build
# WORKDIR /app
# COPY package.json package-lock.json ./  
# RUN npm install

# COPY . .


# RUN npm run build

# frontend/Dockerfile

# -------- Build stage --------
FROM node:22-alpine AS build
WORKDIR /app

# ไลบรารีที่มักต้องใช้ตอน build (เช่น sharp / node-gyp)
RUN apk add --no-cache libc6-compat python3 make g++

COPY package.json package-lock.json ./
# ใช้ devDependencies ด้วยเพราะเป็น build-time
RUN npm install

COPY . .
# กัน OOM ตอน build
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm run build

# รวม output เป็นโฟลเดอร์เดียวชื่อ out
RUN if [ -d build ]; then mv build out; \
    elif [ -d dist ]; then mv dist out; \
    else echo "❌ No build output dir (build/dist)"; exit 1; fi

# -------- Export-to-volume stage --------
FROM alpine:3.20
WORKDIR /app
VOLUME ["/app/build"]
COPY --from=build /app/out /opt/build
CMD sh -c 'if [ -z "$(ls -A /app/build 2>/dev/null)" ]; then cp -r /opt/build/* /app/build/; fi; tail -f /dev/null'


