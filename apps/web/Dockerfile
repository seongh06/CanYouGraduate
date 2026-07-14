# 빌드 컨텍스트는 리포지토리 루트여야 함(npm workspaces로 packages/shared-types를 참조하므로).
# NEXT_PUBLIC_* 값은 next build 시점에 클라이언트 번들에 굳어지므로 반드시 빌드 ARG로 주입해야 한다
# (컨테이너 실행 시 환경변수로 넘겨도 이미 빌드된 번들에는 반영되지 않음).
FROM node:20-alpine AS build
WORKDIR /repo
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm ci
RUN npm run build -w packages/shared-types
RUN npm run build -w apps/web

FROM node:20-alpine AS runtime
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=build /repo /repo
EXPOSE 3000
CMD ["npm", "run", "start", "-w", "apps/web"]
