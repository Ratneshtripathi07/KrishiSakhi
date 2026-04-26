-- DropForeignKey
ALTER TABLE "SensorData" DROP CONSTRAINT "SensorData_farm_id_fkey";

-- AlterTable
ALTER TABLE "SensorData" ALTER COLUMN "timestamp" SET DATA TYPE TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "SensorData" ADD CONSTRAINT "SensorData_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "sensor_data_farm_id_idx" RENAME TO "SensorData_farm_id_idx";

-- RenameIndex
ALTER INDEX "sensor_data_timestamp_idx" RENAME TO "SensorData_timestamp_idx";
