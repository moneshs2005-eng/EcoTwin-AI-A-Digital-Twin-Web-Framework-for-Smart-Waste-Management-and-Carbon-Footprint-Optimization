import React, { useEffect, useState } from 'react';
import {
  X,
  Trash2,
  Battery,
  Thermometer,
  Calendar,
  Send,
  Activity,
  History,
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { api } from '../services/api';
import { WasteBin, WasteRecord, Prediction } from '../types';

interface BinDetailModalProps {
  binId: string;
  onClose: () => void;
  onUpdated: () => void;
}

export const BinDetailModal: React.FC<BinDetailModalProps> = ({ binId, onClose, onUpdated }) => {
  const [binData, setBinData] = useState<(WasteBin & { recent_records: WasteRecord[]; latest_prediction: Prediction | null }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [simLevel, setSimLevel] = useState<number>(50);
  const [simTemp, setSimTemp] = useState<number>(20);
  const [isSending, setIsSending] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await api.getBinById(binId);
      setBinData(res.data);
      setSimLevel(res.data.waste_percentage);
      setSimTemp(res.data.temperature_c);
    } catch (err) {
      console.error('Error fetching bin details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [binId]);

  const handleSimulateIotIngestion = async () => {
    if (!binData) return;
    try {
      setIsSending(true);
      await api.ingestSensorReading({
        bin_id: binData.bin_id,
        waste_percentage: Number(simLevel),
        temperature: Number(simTemp),
      });
      await fetchDetails();
      onUpdated();
    } catch (err: any) {
      alert('Ingestion failed: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  if (!binData) return null;

  const chartData = (binData.recent_records || []).map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    waste_percentage: r.waste_percentage,
    temperature: r.temperature,
  }));

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-6 p-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{binData.bin_id}</h2>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-lg uppercase ${
                    binData.status === 'FULL' || binData.waste_percentage >= 85
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : binData.status === 'HIGH'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {binData.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">{binData.name} • {binData.location_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current State & Historical Curve */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-slate-400">Current Fill</span>
              <div className="text-xl font-bold text-white mt-1">{binData.waste_percentage}%</div>
              <div className="text-[10px] text-slate-500">{binData.current_waste_level}L / {binData.capacity}L</div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-slate-400">Sensor Battery</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">{binData.battery_level}%</div>
              <div className="text-[10px] text-emerald-500">Lithium-ion OK</div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-slate-400">Temperature</span>
              <div className="text-xl font-bold text-slate-200 mt-1">{binData.temperature_c}°C</div>
              <div className="text-[10px] text-slate-500">Internal Acoustic</div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-slate-400">Stream Type</span>
              <div className="text-sm font-bold text-cyan-400 mt-1">{binData.waste_type}</div>
              <div className="text-[10px] text-slate-500">Dedicated</div>
            </div>
          </div>

          {/* Historical Trend Line */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-emerald-400" />
                Recent Fill Progression History
              </span>
              <span className="text-[11px] text-slate-500">Last 6 Sensor Intervals</span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      fontSize: '11px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="waste_percentage"
                    name="Fill Level %"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ fill: '#10b981', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Simulated Edge Hardware Ingestion Tool */}
          <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                IoT Sensor Telemetry Ingestion (POST /api/sensors/waste)
              </span>
              <span className="text-[10px] text-slate-400">Edge Hardware Protocol</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Set Fill Level (%): {simLevel}%</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={simLevel}
                  onChange={(e) => setSimLevel(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Internal Temp (°C): {simTemp}°C</label>
                <input
                  type="range"
                  min={10}
                  max={45}
                  value={simTemp}
                  onChange={(e) => setSimTemp(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>

            <button
              onClick={handleSimulateIotIngestion}
              disabled={isSending}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md active:scale-98 disabled:opacity-50"
            >
              {isSending ? 'Transmitting Ingestion Packet...' : 'Transmit Ingested Telemetry to Digital Twin'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
