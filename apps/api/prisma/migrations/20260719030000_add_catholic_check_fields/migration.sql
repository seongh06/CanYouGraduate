-- AlterTable
ALTER TABLE "catalog_catholic_checks" ADD COLUMN     "match_patterns" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "credit" INTEGER,
ADD COLUMN     "admission_year_from" INTEGER,
ADD COLUMN     "data_source" "RequirementDataSource" NOT NULL DEFAULT 'PAGE_DIRECT',
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "source_url" TEXT;
