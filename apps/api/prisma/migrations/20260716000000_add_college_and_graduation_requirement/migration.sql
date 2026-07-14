-- DropForeignKey
ALTER TABLE "catalog_track_requirements" DROP CONSTRAINT "catalog_track_requirements_catalog_course_id_fkey";

-- DropForeignKey
ALTER TABLE "catalog_track_requirements" DROP CONSTRAINT "catalog_track_requirements_track_id_fkey";

-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "base_url" TEXT,
ADD COLUMN     "college_id" INTEGER,
ADD COLUMN     "domain_slug" TEXT,
ADD COLUMN     "url_pattern" TEXT NOT NULL DEFAULT 'standard';

-- DropTable
DROP TABLE "catalog_track_requirements";

-- CreateTable
CREATE TABLE "colleges" (
    "id" INTEGER NOT NULL,
    "university_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "campus" TEXT NOT NULL DEFAULT '성심',

    CONSTRAINT "colleges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_graduation_requirements" (
    "id" SERIAL NOT NULL,
    "department_id" INTEGER NOT NULL,
    "admission_year_from" INTEGER NOT NULL,
    "admission_year_to" INTEGER,
    "total_credit_min" INTEGER,
    "credit_breakdown" JSONB,
    "comprehensive_exam" JSONB,
    "substitution_rules" JSONB NOT NULL DEFAULT '[]',
    "language_score_standard" JSONB,
    "thesis_optional" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "catalog_graduation_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "colleges_university_id_idx" ON "colleges"("university_id");

-- CreateIndex
CREATE INDEX "catalog_graduation_requirements_department_id_idx" ON "catalog_graduation_requirements"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_courses_department_id_code_key" ON "catalog_courses"("department_id", "code");

-- CreateIndex
CREATE INDEX "departments_college_id_idx" ON "departments"("college_id");

-- AddForeignKey
ALTER TABLE "colleges" ADD CONSTRAINT "colleges_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_graduation_requirements" ADD CONSTRAINT "catalog_graduation_requirements_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

