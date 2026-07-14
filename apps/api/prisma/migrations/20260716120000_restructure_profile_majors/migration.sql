-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('DOUBLE_MAJOR', 'DEEPENED_MAJOR');

-- DropForeignKey
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_track_id_fkey";

-- DropIndex
DROP INDEX "profiles_track_id_idx";

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "track_id",
ADD COLUMN     "has_micro_degree" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "major_track_id" INTEGER,
ADD COLUMN     "program_type" "ProgramType" NOT NULL,
ADD COLUMN     "second_major_department_id" INTEGER,
ADD COLUMN     "second_major_track_id" INTEGER;

-- CreateIndex
CREATE INDEX "profiles_second_major_department_id_idx" ON "profiles"("second_major_department_id");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_major_track_id_fkey" FOREIGN KEY ("major_track_id") REFERENCES "tracks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_second_major_department_id_fkey" FOREIGN KEY ("second_major_department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_second_major_track_id_fkey" FOREIGN KEY ("second_major_track_id") REFERENCES "tracks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

