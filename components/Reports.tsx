
import React from 'react';
import { Download, Calendar, Filter, ChevronRight } from 'lucide-react';

interface ReportsProps {
  data: any[];
  onOpenEntity: (item: any) => void;
}

export const Reports: React.FC<ReportsProps> = ({ data, onOpenEntity }) => {
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Reports</h2>
          <p className="text-zinc-500 text-base mt-1">Detailed log of all intercepted tracking attempts.</p>
        </div>
        
        <div className="flex gap-3">
             <button className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-full transition-colors">
                <Calendar className="w-4 h-4" />
                <span>Last 24 Hours</span>
             </button>
             <button className="flex items-center gap-2 px-5 py-2.5 bg-[#4DFFBC] hover:opacity-90 text-black text-sm font-bold rounded-full transition-colors">
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
             </button>
        </div>
      </div>

      {/* Block List Table */}
      <div className="bg-zinc-900 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
            <h3 className="font-bold text-white">Activity Log</h3>
            <button className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-full">
                <Filter className="w-4 h-4" />
            </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-900 text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">Time</th>
                <th className="px-6 py-4 font-medium">Website</th>
                <th className="px-6 py-4 font-medium">Tracker Category</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {data.map((row) => (
                <tr 
                    key={row.id} 
                    onClick={() => onOpenEntity({ ...row, company: 'AdTech Inc.', riskLevel: row.action === 'Blocked' ? 'High' : 'Low' })}
                    className="hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 text-zinc-500 font-medium">{row.timestamp}</td>
                  <td className="px-6 py-4 font-medium text-white">{row.domain}</td>
                  <td className="px-6 py-4 text-zinc-400">
                      <span className="inline-block bg-black px-2 py-1 rounded-md text-xs font-medium text-zinc-300">
                        {row.category}
                      </span>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${row.action === 'Blocked' ? 'bg-[#FF4D4D]' : 'bg-[#4DFFBC]'}`}></div>
                        <span className={`font-medium ${row.action === 'Blocked' ? 'text-[#FF4D4D]' : 'text-[#4DFFBC]'}`}>
                            {row.action}
                        </span>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-zinc-500">No activity recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
