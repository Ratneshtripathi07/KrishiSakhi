-- AlterTable
ALTER TABLE "CropCycle" ADD COLUMN     "seed_source" TEXT,
ADD COLUMN     "stage" TEXT,
ADD COLUMN     "variety" TEXT;

-- AlterTable
ALTER TABLE "Farm" ADD COLUMN     "area_unit" TEXT DEFAULT 'acres',
ADD COLUMN     "challenges" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "drainage_condition" TEXT,
ADD COLUMN     "equipment" JSONB,
ADD COLUMN     "irrigation_system" TEXT,
ADD COLUMN     "k_level" DECIMAL(6,2),
ADD COLUMN     "livestock" JSONB,
ADD COLUMN     "n_level" DECIMAL(6,2),
ADD COLUMN     "organic_carbon" DECIMAL(5,2),
ADD COLUMN     "p_level" DECIMAL(6,2),
ADD COLUMN     "photos" JSONB,
ADD COLUMN     "preferred_language" TEXT,
ADD COLUMN     "previous_crops" JSONB,
ADD COLUMN     "primary_goal" TEXT,
ADD COLUMN     "rotation_pattern" TEXT,
ADD COLUMN     "soil_ph" DECIMAL(4,2),
ADD COLUMN     "soil_test_report_url" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "village" TEXT,
ADD COLUMN     "water_availability" TEXT;
