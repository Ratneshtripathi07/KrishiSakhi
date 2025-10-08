-- AlterTable
ALTER TABLE "Farm" ADD COLUMN     "area_acres" DECIMAL(6,2);

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "farm_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "due_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmMetrics" (
    "id" SERIAL NOT NULL,
    "farm_id" INTEGER NOT NULL,
    "yield_forecast" INTEGER,
    "pest_risk" TEXT,
    "water_requirement" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Task_farm_id_idx" ON "Task"("farm_id");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FarmMetrics_farm_id_key" ON "FarmMetrics"("farm_id");

-- CreateIndex
CREATE INDEX "Farm_user_id_idx" ON "Farm"("user_id");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmMetrics" ADD CONSTRAINT "FarmMetrics_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
