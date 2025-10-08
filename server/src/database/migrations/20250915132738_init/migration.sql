-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "phone_number" TEXT NOT NULL,
    "name" TEXT,
    "language_preference" TEXT NOT NULL DEFAULT 'en',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "otp_code" TEXT,
    "otp_expires_at" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Farm" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "farm_name" TEXT,
    "location_lat" DECIMAL(9,6) NOT NULL,
    "location_lon" DECIMAL(9,6) NOT NULL,
    "soil_type" TEXT,
    "irrigation_source" TEXT,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropCycle" (
    "id" SERIAL NOT NULL,
    "farm_id" INTEGER NOT NULL,
    "crop_name" TEXT NOT NULL,
    "sowing_date" TIMESTAMP(3) NOT NULL,
    "expected_harvest_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CropCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" SERIAL NOT NULL,
    "crop_cycle_id" INTEGER NOT NULL,
    "activity_type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "data" JSONB,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvisoryRule" (
    "id" SERIAL NOT NULL,
    "crop_name" TEXT,
    "trigger_event" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "recommendation_key" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AdvisoryRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "alert_type" TEXT NOT NULL,
    "content_key" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_number_key" ON "User"("phone_number");

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropCycle" ADD CONSTRAINT "CropCycle_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_crop_cycle_id_fkey" FOREIGN KEY ("crop_cycle_id") REFERENCES "CropCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
