-- CreateTable
CREATE TABLE "track_course_recognitions" (
    "id" SERIAL NOT NULL,
    "department_id" INTEGER NOT NULL,
    "track_id" INTEGER NOT NULL,
    "offering_department_name" TEXT,
    "course_code" TEXT,
    "course_name" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "track_course_recognitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "track_course_recognitions_department_id_track_id_idx" ON "track_course_recognitions"("department_id", "track_id");

-- AddForeignKey
ALTER TABLE "track_course_recognitions" ADD CONSTRAINT "track_course_recognitions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_course_recognitions" ADD CONSTRAINT "track_course_recognitions_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
