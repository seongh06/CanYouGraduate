-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "cross_major_recognized" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "cross_major_credit_recognitions" (
    "id" SERIAL NOT NULL,
    "recognizing_department_id" INTEGER NOT NULL,
    "offering_department_name" TEXT NOT NULL,
    "course_name" TEXT NOT NULL,
    "course_code" TEXT NOT NULL,
    "note" TEXT,
    "series_label" TEXT,

    CONSTRAINT "cross_major_credit_recognitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cross_major_credit_recognitions_recognizing_department_id_idx" ON "cross_major_credit_recognitions"("recognizing_department_id", "course_name");

-- AddForeignKey
ALTER TABLE "cross_major_credit_recognitions" ADD CONSTRAINT "cross_major_credit_recognitions_recognizing_department_id_fkey" FOREIGN KEY ("recognizing_department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
