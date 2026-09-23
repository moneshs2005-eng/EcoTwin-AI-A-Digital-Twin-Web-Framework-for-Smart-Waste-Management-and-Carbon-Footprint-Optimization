import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Route,
  Leaf,
} from 'lucide-react';
import { api } from '../services/api';
import { WasteBin, OptimizedRoute } from '../types';

export const ReportsView: React.FC = () => {
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.getReportsData();
      setReport(res);
    } catch (err) {
      console.error('Failed to generate audit report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleExportCSV = () => {
    if (!report) return;

    // Construct CSV content
    const headers = ['Bin_ID', 'Name', 'District', 'Stream_Type', 'Capacity_L', 'Current_Fill_Pct', 'Status', 'Battery_Pct'];
    const rows = (report.bins_overview || []).map((b: WasteBin) => [
      b.bin_id,
      `"${b.name}"`,
      `"${b.location_name}"`,
      b.waste_type,
      b.capacity,
      b.waste_percentage,
      b.status,
      b.battery_level,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EcoTwin_Audit_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !report) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Compiling Municipal Audit Report...</p>
        </div>
      </div>
    );
  }

  const { summary, bins_overview, routes_overview } = report;

  return (
    <div className="space-y-6 pb-12 print:bg-white print:text-black">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Municipal Audit & Compliance Reports</h1>
          </div>
          <p className="text-xs text-slate-400">
            Exportable operational metrics, waste collection records, and ESG decarbonization reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2.5 rounded-2xl shadow-lg shadow-emerald-950/60 transition-all text-xs active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-2xl border border-slate-700 transition-all text-xs active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl print:border-0 print:p-0">
        {/* Document Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl text-white">EcoTwin AI Audit & Carbon Disclosure</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                OFFICIAL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Smart Waste Management & Digital Twin Optimization Platform</p>
          </div>

          <div className="text-right text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 justify-end">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Generated: {new Date(report.generated_at).toLocaleString()}</span>
            </div>
            <div className="font-mono text-[11px] text-slate-500">Ref: AUDIT-ECO-2026-Q3</div>
          </div>
        </div>

        {/* Executive Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
            <div className="text-slate-400">Total Bins</div>
            <div className="text-xl font-bold text-white mt-1">{summary?.total_bins}</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
            <div className="text-slate-400">Average Fill %</div>
            <div className="text-xl font-bold text-amber-400 mt-1">{summary?.average_fill_pct}%</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
            <div className="text-slate-400">High-Risk Overflow</div>
            <div className="text-xl font-bold text-rose-400 mt-1">{summary?.high_risk_bins}</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
            <div className="text-slate-400">Routes Executed</div>
            <div className="text-xl font-bold text-cyan-400 mt-1">{summary?.total_routes_executed}</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
            <div className="text-slate-400">Fuel Conserved</div>
            <div className="text-xl font-bold text-teal-400 mt-1">{summary?.fuel_saved_liters} L</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
            <div className="text-slate-400">CO2 Mitigated</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">{summary?.carbon_mitigated_kg} kg</div>
          </div>
        </div>

        {/* Bins Table Extract */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white">Active Sensor Assets Inventory</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Bin ID</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Capacity</th>
                  <th className="py-2.5 px-3">Current Fill</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(bins_overview || []).slice(0, 10).map((b: WasteBin) => (
                  <tr key={b.bin_id} className="hover:bg-slate-800/20">
                    <td className="py-2 px-3 font-mono font-bold text-white">{b.bin_id}</td>
                    <td className="py-2 px-3 text-slate-300">{b.name} ({b.location_name})</td>
                    <td className="py-2 px-3 text-slate-400">{b.waste_type}</td>
                    <td className="py-2 px-3 text-slate-400">{b.capacity}L</td>
                    <td className="py-2 px-3 font-semibold text-slate-200">{b.waste_percentage}%</td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] font-bold text-emerald-400">{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Verification Signoff */}
        <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Digital Twin Automated Audit Ledger • Immutable Hash Signature</span>
          </div>
          <div>Page 1 of 1</div>
        </div>
      </div>
    </div>
  );
};
