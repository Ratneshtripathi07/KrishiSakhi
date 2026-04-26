"use client";

import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { ThermometerSun, Droplets, Leaf, FlaskConical, TestTube2, Wind, Loader2, Play, Square } from "lucide-react";
import { api } from '@/services/api';

export default function HardwareDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isSimulating, setIsSimulating] = useState(false);
  const weatherRef = useRef<{temp: number, hum: number} | null>(null);

  // Auto-refresh data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/hardware/data/1");
        setData(response.data);
      } catch (err) {
        setError("Failed to fetch hardware data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData(); // Initial load
    const interval = setInterval(fetchData, isSimulating ? 5000 : 30000); 

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Hardware Simulation hook
  useEffect(() => {
    let simInterval: NodeJS.Timeout;
    if (isSimulating) {
        const simulate = async () => {
            let temp = 28.0;
            let hum = 60.0;
            
            // Fetch real weather data as a seed for synthetic hardware
            if (!weatherRef.current) {
               try {
                  const res = await api.get('/weather?lat=26.8467&lon=80.9462');
                  if (res.data) {
                      // Attempt a few common paths based on what the weather endpoint might return
                      const apiTemp = res.data?.current?.temperature ?? res.data?.current_weather?.temperature ?? res.data?.temp;
                      const apiHum = res.data?.current?.humidity ?? res.data?.current_weather?.humidity ?? res.data?.humidity;
                      
                      if (apiTemp !== undefined && apiTemp !== null) temp = Number(apiTemp);
                      if (apiHum !== undefined && apiHum !== null) hum = Number(apiHum);
                  }
               } catch(e) {
                  console.warn("Simulator could not fetch weather seed, using defaults.");
               }
            } else {
               // Add slight jitter
               temp = weatherRef.current.temp + (Math.random() * 1.5 - 0.75);
               hum = weatherRef.current.hum + (Math.random() * 2 - 1);
            }

            // Defend against NaNs or undefined before caching and rendering
            temp = isNaN(temp) || temp == null ? 28.0 : temp;
            hum = isNaN(hum) || hum == null ? 60.0 : hum;
            
            weatherRef.current = {temp, hum};
            
            const payload = {
                farmId: 1,
                t: parseFloat(temp.toFixed(1)),
                h: parseFloat(hum.toFixed(1)),
                st: parseFloat((temp - 2 + Math.random()).toFixed(1)),
                m: Math.floor(30 + Math.random() * 20),
                ph: parseFloat((6.5 + Math.random()).toFixed(1)),
                n: Math.floor(40 + Math.random() * 20),
                p: Math.floor(20 + Math.random() * 10),
                k: Math.floor(50 + Math.random() * 20)
            };
            
            await api.get('/hardware/update-data', { params: payload });
        };
        simulate();
        simInterval = setInterval(simulate, 5000); // Generate data every 5 seconds
    }
    return () => clearInterval(simInterval);
  }, [isSimulating]);

  const latestData = data[0]; // Recent record

  const CardWrap = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`group rounded-2xl border bg-white/95 dark:bg-[#1E1E1E]/95 dark:border-gray-800 shadow-sm hover:shadow-2xl transition-all duration-300 ${className}`}>
      {children}
    </div>
  );

  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen px-4 py-8 bg-gradient-to-b from-emerald-50 to-white dark:from-[#0f0f0f] dark:to-[#121212] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Leaf className="text-emerald-600 w-8 h-8" />
              IoT Field Sensors
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Live telemetry from ESP32 tracking micro-climate and soil health.</p>
          </div>
          
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm ${
              isSimulating 
                ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800'
                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800'
            }`}
          >
            {isSimulating ? (
              <><Square className="w-4 h-4 fill-current" /> Stop Simulation</>
            ) : (
              <><Play className="w-4 h-4 fill-current" /> Auto-Simulate Data</>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : error ? (
          <div className="text-red-500 bg-red-50 p-4 rounded-xl border border-red-200">{error}</div>
        ) : !latestData ? (
          <div className="text-gray-500 p-4 bg-gray-50 dark:bg-[#1e1e1e] rounded-xl border border-dashed border-gray-300 dark:border-gray-700">Waiting for sensor data transmission...</div>
        ) : (
          <div className="space-y-6">
            <div className="text-sm text-right text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 w-max ml-auto px-3 py-1 rounded-full font-medium">
              Last updated: {format(new Date(latestData.timestamp), 'PPpp')}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Air Context */}
              <CardWrap className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                    <ThermometerSun className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500 font-medium">Ambient Temp</h3>
                    <div className="text-2xl font-bold mt-1">{latestData.air_temp || '—'}°C</div>
                  </div>
                </div>
              </CardWrap>
              
              <CardWrap className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-sky-100 dark:bg-sky-900/40 rounded-xl">
                    <Wind className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500 font-medium">Air Humidity</h3>
                    <div className="text-2xl font-bold mt-1">{latestData.humidity || '—'}%</div>
                  </div>
                </div>
              </CardWrap>

              <CardWrap className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/40 rounded-xl">
                    <TestTube2 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500 font-medium">Soil Temp</h3>
                    <div className="text-2xl font-bold mt-1">{latestData.soil_temp || '—'}°C</div>
                  </div>
                </div>
              </CardWrap>

              <CardWrap className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-cyan-100 dark:bg-cyan-900/40 rounded-xl">
                    <Droplets className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500 font-medium">Soil Moisture</h3>
                    <div className="text-2xl font-bold mt-1">{latestData.moisture || '—'}%</div>
                  </div>
                </div>
              </CardWrap>

              {/* NPK Values */}
              <CardWrap className="p-6 lg:col-span-2">
                 <div className="flex items-center gap-3 mb-4">
                   <FlaskConical className="w-5 h-5 text-emerald-600" />
                   <h3 className="font-semibold">NPK Levels (mg/kg)</h3>
                 </div>
                 <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-lg text-center">
                      <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Nitrogen (N)</div>
                      <div className="text-xl font-semibold text-emerald-700 dark:text-emerald-400">{latestData.n_level || '—'}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-lg text-center">
                      <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Phosphorus (P)</div>
                      <div className="text-xl font-semibold text-emerald-700 dark:text-emerald-400">{latestData.p_level || '—'}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-lg text-center">
                      <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Potassium (K)</div>
                      <div className="text-xl font-semibold text-emerald-700 dark:text-emerald-400">{latestData.k_level || '—'}</div>
                    </div>
                 </div>
              </CardWrap>

              <CardWrap className="p-6 lg:col-span-2">
                 <div className="flex items-center justify-between gap-3 mb-4">
                   <div className="flex items-center gap-3">
                     <TestTube2 className="w-5 h-5 text-purple-600" />
                     <h3 className="font-semibold">Soil pH</h3>
                   </div>
                   <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">{latestData.ph_level || '—'}</div>
                 </div>
                 
                 {/* Visual pH Bar */}
                 <div className="w-full h-8 flex rounded-xl overflow-hidden mt-2 relative border dark:border-gray-700">
                    <div className="h-full w-[28%] bg-red-400" title="Acidic (0-4)"></div>
                    <div className="h-full w-[21%] bg-yellow-400" title="Slightly Acidic (4-6.5)"></div>
                    <div className="h-full w-[14%] bg-green-500" title="Neutral (6.5-7.5)"></div>
                    <div className="h-full w-[37%] bg-blue-500" title="Alkaline (7.5-14)"></div>
                    {latestData.ph_level && (
                      <div 
                        className="absolute h-10 w-2 bg-black dark:bg-white rounded-full -top-1" 
                        style={{ left: `${(latestData.ph_level / 14) * 100}%`, transform: 'translateX(-50%)' }} 
                      />
                    )}
                 </div>
                 <div className="flex justify-between text-[10px] text-gray-400 mt-1 uppercase font-bold">
                   <span>Acidic</span>
                   <span className="-ml-8">Neutral</span>
                   <span>Alkaline</span>
                 </div>
              </CardWrap>

            </div>

            {/* Historical Tab (Simplified) */}
            <CardWrap className="p-5 mt-6">
               <h3 className="font-semibold mb-4 text-emerald-800 dark:text-emerald-300">Recent Transmission Ledger</h3>
               <div className="overflow-x-auto text-sm border dark:border-gray-800 rounded-xl">
                 <table className="w-full">
                   <thead>
                     <tr className="bg-gray-50 dark:bg-black/30 border-b dark:border-gray-800">
                       <th className="py-3 px-4 text-left font-medium">Timestamp</th>
                       <th className="py-3 px-4 text-left font-medium">Temp / Hum</th>
                       <th className="py-3 px-4 text-left font-medium">Soil (M / T)</th>
                       <th className="py-3 px-4 text-left font-medium">NPK</th>
                       <th className="py-3 px-4 text-left font-medium">pH</th>
                     </tr>
                   </thead>
                   <tbody>
                     {data.slice(0, 10).map((row, i) => (
                       <tr key={i} className="border-b last:border-b-0 dark:border-gray-800">
                         <td className="py-3 px-4 font-mono text-xs">{format(new Date(row.timestamp), 'MM/dd HH:mm:ss')}</td>
                         <td className="py-3 px-4">{row.air_temp}°C / {row.humidity}%</td>
                         <td className="py-3 px-4">{row.moisture}% / {row.soil_temp}°C</td>
                         <td className="py-3 px-4">{row.n_level}-{row.p_level}-{row.k_level}</td>
                         <td className="py-3 px-4">{row.ph_level}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </CardWrap>
          </div>
        )}
      </div>
    </div>
  );
}
