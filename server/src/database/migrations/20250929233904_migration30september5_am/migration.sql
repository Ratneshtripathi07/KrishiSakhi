/*
  Warnings:

  - Made the column `area_unit` on table `Farm` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Farm" ALTER COLUMN "area_unit" SET NOT NULL;

-- CreateTable
CREATE TABLE "Scheme" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eligibility" TEXT,
    "link" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grievance" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grievance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Grievance_user_id_idx" ON "Grievance"("user_id");

-- CreateIndex
CREATE INDEX "Grievance_status_idx" ON "Grievance"("status");

-- AddForeignKey
ALTER TABLE "Grievance" ADD CONSTRAINT "Grievance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
