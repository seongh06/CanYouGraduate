# 빌드 컨텍스트는 리포지토리 루트여야 함(npm workspaces로 packages/shared-types를 참조하므로).
# docker build -f apps/api/Dockerfile . 또는 docker-compose.prod.yml에서 context: . 로 실행.
#
# node:20-alpine에는 OpenSSL이 아예 없어서 Prisma 엔진 바이너리가 libssl.so를 dlopen하지 못하고
# "Error loading shared library libssl.so.1.1: No such file or directory"로 즉시 크래시한다
# (Prisma generate 시 "Prisma failed to detect the libssl/openssl version" 경고가 바로 그 신호).
# build/runtime 양쪽 스테이지 모두에 openssl을 설치해야 한다 — build 단계는 올바른 엔진 바이너리를
# 고르기 위해, runtime 단계는 실제 dlopen 대상 .so 파일이 존재해야 하기 때문.
FROM node:20-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /repo
COPY . .
RUN npm ci
RUN npm run build -w packages/shared-types
RUN npx prisma generate --schema apps/api/prisma/schema.prisma
RUN npm run build -w apps/api

FROM node:20-alpine AS runtime
RUN apk add --no-cache openssl
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=build /repo /repo
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
