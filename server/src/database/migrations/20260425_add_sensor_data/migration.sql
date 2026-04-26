CREATE TABLE "SensorData" (
  "id" SERIAL PRIMARY KEY,
  "farm_id" INTEGER NOT NULL REFERENCES "Farm"("id") ON DELETE CASCADE,
  "air_temp" DOUBLE PRECISION,
  "humidity" DOUBLE PRECISION,
  "soil_temp" DOUBLE PRECISION,
  "moisture" INTEGER,
  "n_level" INTEGER,
  "p_level" INTEGER,
  "k_level" INTEGER,
  "ph_level" DOUBLE PRECISION,
  "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "sensor_data_farm_id_idx" ON "SensorData"("farm_id");
CREATE INDEX "sensor_data_timestamp_idx" ON "SensorData"("timestamp");
