// server/src/database/seeds/farms_seed.ts
import { prisma } from '../../config/database';

async function main() {
  // Find any user; if none, create a demo user
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({ data: { phone_number: '+911234567890', name: 'Demo Farmer' } });
  }

  // Create farms if none exist for this user
  const existing = await prisma.farm.findMany({ where: { user_id: user.id } });
  if (existing.length === 0) {
    const farm1 = await prisma.farm.create({ data: {
      user_id: user.id,
      farm_name: 'Farm 1',
      area_acres: '2.00',
      location_lat: '11.8740',
      location_lon: '75.3704',
      soil_type: 'Loamy',
      irrigation_source: 'Canal'
    }});
    const farm2 = await prisma.farm.create({ data: {
      user_id: user.id,
      farm_name: 'Farm 2',
      area_acres: '1.50',
      location_lat: '11.8750',
      location_lon: '75.3720',
      soil_type: 'Sandy',
      irrigation_source: 'Tube-well'
    }});
    const farm3 = await prisma.farm.create({ data: {
      user_id: user.id,
      farm_name: 'Farm 3',
      area_acres: '3.00',
      location_lat: '11.8760',
      location_lon: '75.3735',
      soil_type: 'Clay',
      irrigation_source: 'Rain-fed'
    }});

    // Crop cycles
    await prisma.cropCycle.create({ data: { farm_id: farm1.id, crop_name: 'Rice', sowing_date: new Date(), status: 'active' } });
    await prisma.cropCycle.create({ data: { farm_id: farm2.id, crop_name: 'Wheat', sowing_date: new Date(), status: 'active' } });
    await prisma.cropCycle.create({ data: { farm_id: farm3.id, crop_name: 'Corn', sowing_date: new Date(), status: 'active' } });

    // Metrics
    await prisma.farmMetrics.create({ data: { farm_id: farm1.id, yield_forecast: 70, pest_risk: 'Low', water_requirement: 'Low' } });
    await prisma.farmMetrics.create({ data: { farm_id: farm2.id, yield_forecast: 55, pest_risk: 'Low', water_requirement: 'High' } });
    await prisma.farmMetrics.create({ data: { farm_id: farm3.id, yield_forecast: 80, pest_risk: 'Medium', water_requirement: 'Medium' } });

    // Tasks
    await prisma.task.createMany({ data: [
      { farm_id: farm2.id, title: 'Irrigate Farm 2', status: 'pending' },
      { farm_id: farm1.id, title: 'Check soil moisture in Farm 1', status: 'done', completed_at: new Date() },
      { farm_id: farm3.id, title: 'Spray pesticide in Farm 3', status: 'pending' },
    ]});
  }

  console.log('[seed:farm] done');
}

main().finally(async () => { await prisma.$disconnect(); });
