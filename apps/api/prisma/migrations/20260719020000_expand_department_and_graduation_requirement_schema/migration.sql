-- 기존 배포 환경(운영 DB 포함)에 구 스키마 시드 행이 이미 존재해서 cohort_label을
-- 곧바로 NOT NULL로 추가할 수 없다. nullable로 추가 → 기존 행은 admission_year_from/To
-- 기반으로 백필 → NOT NULL로 강제하는 3단계로 나눈다(prisma migrate dev가 생성한
-- 원본 스텝은 빈 테이블만 가정해 그대로 적용하면 운영에서 실패한다).
-- CreateEnum
CREATE TYPE "RequirementScope" AS ENUM ('ALL', 'FIRST_MAJOR', 'DOUBLE_MAJOR');

-- CreateEnum
CREATE TYPE "RequirementBasis" AS ENUM ('ADMISSION_YEAR', 'GRADUATION_DATE');

-- CreateEnum
CREATE TYPE "RequirementDataSource" AS ENUM ('PAGE_DIRECT', 'NOTICE_ATTACHMENT', 'SEARCH_SNIPPET', 'NOT_FOUND', 'NOT_YET_ESTABLISHED');

-- CreateEnum
CREATE TYPE "ScoringMethod" AS ENUM ('PASS_FAIL', 'POINT_ACCUMULATION');

-- DropIndex
DROP INDEX "catalog_graduation_requirements_department_id_admission_yea_key";

-- AlterTable
ALTER TABLE "catalog_graduation_requirements" ADD COLUMN     "attachment_url" TEXT,
ADD COLUMN     "basis" "RequirementBasis" NOT NULL DEFAULT 'ADMISSION_YEAR',
ADD COLUMN     "cohort_label" TEXT,
ADD COLUMN     "data_source" "RequirementDataSource" NOT NULL DEFAULT 'PAGE_DIRECT',
ADD COLUMN     "graduation_date_from" TEXT,
ADD COLUMN     "mandatory_requirements" JSONB,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "point_threshold" INTEGER,
ADD COLUMN     "scope" "RequirementScope" NOT NULL DEFAULT 'ALL',
ADD COLUMN     "score_items" JSONB,
ADD COLUMN     "scoring_method" "ScoringMethod" NOT NULL DEFAULT 'PASS_FAIL',
ADD COLUMN     "source_url" TEXT,
ADD COLUMN     "track_id" INTEGER,
ADD COLUMN     "track_restriction_note" TEXT,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "admission_year_from" DROP NOT NULL;

-- Backfill: 구 스키마 행은 admission_year_from/To 조합으로 근사 라벨을 만든다.
UPDATE "catalog_graduation_requirements"
SET "cohort_label" = CASE
  WHEN "admission_year_from" IS NULL THEN '미상'
  WHEN "admission_year_to" IS NULL THEN "admission_year_from"::text || '학번~'
  WHEN "admission_year_from" = "admission_year_to" THEN "admission_year_from"::text || '학번'
  ELSE "admission_year_from"::text || '~' || "admission_year_to"::text || '학번'
END
WHERE "cohort_label" IS NULL;

ALTER TABLE "catalog_graduation_requirements" ALTER COLUMN "cohort_label" SET NOT NULL;

-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "academic_requirement_url" TEXT,
ADD COLUMN     "is_administrative_unit" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tracks" ALTER COLUMN "required_course_count" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "catalog_graduation_requirements_track_id_idx" ON "catalog_graduation_requirements"("track_id");

-- AddForeignKey
ALTER TABLE "catalog_graduation_requirements" ADD CONSTRAINT "catalog_graduation_requirements_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
