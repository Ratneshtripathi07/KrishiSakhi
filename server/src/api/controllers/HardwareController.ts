import { Request, Response } from 'express';
import { prisma } from '../../config/database';

export class HardwareController {
  // ESP32 sends a GET request here
  static async updateData(req: Request, res: Response) {
    try {
      const { farmId, t, h, st, m, n, p, k, ph } = req.query;

      // Ensure farmId is provided, or default to a standard farm for demo
      const targetFarmId = farmId ? parseInt(String(farmId), 10) : 1; 

      if (isNaN(targetFarmId)) {
        return res.status(400).send("Invalid farmId");
      }

      await prisma.sensorData.create({
        data: {
          farm_id: targetFarmId,
          air_temp: t ? parseFloat(String(t)) : null,
          humidity: h ? parseFloat(String(h)) : null,
          soil_temp: st ? parseFloat(String(st)) : null,
          moisture: m ? parseInt(String(m), 10) : null,
          n_level: n ? parseInt(String(n), 10) : null,
          p_level: p ? parseInt(String(p), 10) : null,
          k_level: k ? parseInt(String(k), 10) : null,
          ph_level: ph ? parseFloat(String(ph)) : null,
        }
      });

      return res.status(200).send("Data received");
    } catch (error) {
      console.error(error);
      return res.status(500).send("Internal server error");
    }
  }

  static async getData(req: Request, res: Response) {
    try {
      const targetFarmId = parseInt(req.params.farmId, 10) || 1;
      
      const data = await prisma.sensorData.findMany({
        where: { farm_id: targetFarmId },
        orderBy: { timestamp: 'desc' },
        take: 50 // Fetch recent 50 records
      });

      return res.status(200).json(data);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Could not fetch data" });
    }
  }
}
