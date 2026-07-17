-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "is_online" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_shared_university" BOOLEAN NOT NULL DEFAULT false;
