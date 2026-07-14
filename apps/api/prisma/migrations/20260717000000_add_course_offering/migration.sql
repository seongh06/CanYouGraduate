-- CreateTable
CREATE TABLE "course_offerings" (
    "id" SERIAL NOT NULL,
    "university_id" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "term" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "professor" TEXT NOT NULL,
    "credit" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "department_name" TEXT NOT NULL,

    CONSTRAINT "course_offerings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_offerings_university_id_year_term_name_idx" ON "course_offerings"("university_id", "year", "term", "name");

-- CreateIndex
CREATE UNIQUE INDEX "course_offerings_university_id_year_term_code_section_key" ON "course_offerings"("university_id", "year", "term", "code", "section");

-- AddForeignKey
ALTER TABLE "course_offerings" ADD CONSTRAINT "course_offerings_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

