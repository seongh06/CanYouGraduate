# CanYouGraduate?

너졸업할수있어?

에브리타임 시간표 URL 하나로 과거 전체 수강 기록을 자동 추출해, 가톨릭대학교 성심교정 요람 기준 졸업 가능 여부를 즉시 보여주는 서비스. 기획/설계 문서는 Obsidian(`프로젝트 소개`/`API 목록`/`구현 방식`/`아키텍처 다이어그램`/`캘린더`)에 있고, 이 저장소는 구현체다.

## 구조

- `apps/web` — Next.js (App Router) 프론트엔드
- `apps/api` — NestJS 백엔드
- `packages/shared-types` — 프론트/백엔드 공용 응답 타입

## 사전 준비물

- Node.js 20+
- Docker (로컬 PostgreSQL/Redis 실행용)

## 실행 방법 (로컬 개발)

```bash
# 1. 의존성 설치 (루트에서 한 번만 — npm workspaces)
npm install

# 2. 로컬 PostgreSQL + Redis 실행
docker compose up -d

# 3. 환경변수 파일 생성
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 4. Prisma 마이그레이션 (최초 1회 / 스키마 변경 시 — apps/api/.env를 읽어야 하므로 반드시 apps/api에서 실행)
cd apps/api && npx prisma migrate dev && cd ../..

# 5. 백엔드 / 프론트 각각 실행 (터미널 2개)
npm run dev:api    # http://localhost:4000  (헬스체크: GET /health)
npm run dev:web    # http://localhost:3000
```

## 자주 쓰는 명령어

| 명령어 | 설명 |
|---|---|
| `npm run build` | shared-types → api → web 순서로 전체 빌드 |
| `npm run typecheck` | 전체 워크스페이스 타입체크 |
| `npm run lint -w apps/web` | 프론트 린트 |
| `docker compose down` | 로컬 DB/Redis 컨테이너 정지 |
| `docker compose down -v` | 위 + 볼륨(DB 데이터)까지 삭제 |

## 배포

- 프론트: Vercel (`apps/web`을 프로젝트 루트로 지정)
- 백엔드: Docker 이미지 빌드 후 배포 (Railway/Fly.io 등 — [[구현 방식]] 5장 참고), `DATABASE_URL`/`REDIS_URL`/`CORS_ORIGIN`을 운영 값으로 설정

## 작업 방식

이슈 생성 → `dev`에서 feature 브랜치 분기 → 구현 → `dev`로 PR → CodeRabbit 리뷰 반영 → merge. 배포 시점에만 `dev → main` PR을 낸다. 자세한 일정은 Obsidian `캘린더` 문서 참고.
