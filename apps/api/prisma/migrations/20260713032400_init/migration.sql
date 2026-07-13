-- CreateEnum
CREATE TYPE "CourseSource" AS ENUM ('CRAWL', 'TEXT_PASTE', 'MANUAL');

-- CreateTable
CREATE TABLE "universities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "supported" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "university_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "catalog_ready" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracks" (
    "id" SERIAL NOT NULL,
    "department_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "required_course_count" INTEGER NOT NULL,

    CONSTRAINT "tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "admission_year" INTEGER NOT NULL,
    "university_id" INTEGER NOT NULL,
    "major_department_id" INTEGER NOT NULL,
    "minor_department_id" INTEGER,
    "track_id" INTEGER,
    "synced_at" TIMESTAMP(3),

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semesters" (
    "id" SERIAL NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" SERIAL NOT NULL,
    "semester_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "category" TEXT,
    "credit" INTEGER NOT NULL,
    "general" BOOLEAN NOT NULL DEFAULT false,
    "substitution_catalog_course_id" INTEGER,
    "source" "CourseSource" NOT NULL DEFAULT 'MANUAL',

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_courses" (
    "id" SERIAL NOT NULL,
    "department_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "credit" INTEGER NOT NULL,
    "admission_year_from" INTEGER NOT NULL,
    "admission_year_to" INTEGER,

    CONSTRAINT "catalog_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_track_requirements" (
    "id" SERIAL NOT NULL,
    "track_id" INTEGER NOT NULL,
    "catalog_course_id" INTEGER NOT NULL,

    CONSTRAINT "catalog_track_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_catholic_checks" (
    "id" SERIAL NOT NULL,
    "university_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "catalog_catholic_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retake_groups" (
    "id" SERIAL NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "group_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "retake_accepted" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "retake_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "graduation_extra" (
    "profile_id" INTEGER NOT NULL,
    "language_score" INTEGER,
    "thesis_pass" BOOLEAN NOT NULL DEFAULT false,
    "catholic_checks" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "graduation_extra_pkey" PRIMARY KEY ("profile_id")
);

-- CreateIndex
CREATE INDEX "departments_university_id_idx" ON "departments"("university_id");

-- CreateIndex
CREATE INDEX "tracks_department_id_idx" ON "tracks"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_session_id_key" ON "profiles"("session_id");

-- CreateIndex
CREATE INDEX "profiles_university_id_idx" ON "profiles"("university_id");

-- CreateIndex
CREATE INDEX "profiles_major_department_id_idx" ON "profiles"("major_department_id");

-- CreateIndex
CREATE INDEX "profiles_minor_department_id_idx" ON "profiles"("minor_department_id");

-- CreateIndex
CREATE INDEX "profiles_track_id_idx" ON "profiles"("track_id");

-- CreateIndex
CREATE INDEX "semesters_profile_id_idx" ON "semesters"("profile_id");

-- CreateIndex
CREATE INDEX "courses_semester_id_idx" ON "courses"("semester_id");

-- CreateIndex
CREATE INDEX "courses_substitution_catalog_course_id_idx" ON "courses"("substitution_catalog_course_id");

-- CreateIndex
CREATE INDEX "catalog_courses_department_id_idx" ON "catalog_courses"("department_id");

-- CreateIndex
CREATE INDEX "catalog_track_requirements_track_id_idx" ON "catalog_track_requirements"("track_id");

-- CreateIndex
CREATE INDEX "catalog_track_requirements_catalog_course_id_idx" ON "catalog_track_requirements"("catalog_course_id");

-- CreateIndex
CREATE INDEX "catalog_catholic_checks_university_id_idx" ON "catalog_catholic_checks"("university_id");

-- CreateIndex
CREATE UNIQUE INDEX "retake_groups_profile_id_group_key_key" ON "retake_groups"("profile_id", "group_key");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_major_department_id_fkey" FOREIGN KEY ("major_department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_minor_department_id_fkey" FOREIGN KEY ("minor_department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_substitution_catalog_course_id_fkey" FOREIGN KEY ("substitution_catalog_course_id") REFERENCES "catalog_courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_courses" ADD CONSTRAINT "catalog_courses_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_track_requirements" ADD CONSTRAINT "catalog_track_requirements_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_track_requirements" ADD CONSTRAINT "catalog_track_requirements_catalog_course_id_fkey" FOREIGN KEY ("catalog_course_id") REFERENCES "catalog_courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_catholic_checks" ADD CONSTRAINT "catalog_catholic_checks_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retake_groups" ADD CONSTRAINT "retake_groups_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "graduation_extra" ADD CONSTRAINT "graduation_extra_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
