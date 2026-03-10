import React, { useEffect, useState, useRef } from 'react';
import { fetchAllTeams } from '../services/supabaseClient';
import { TeamRegistration } from '../types';
import { LayoutDashboard, Users, LogOut, Search, Code2, Layers, Cpu, Database, RefreshCw, Sparkles, ChevronUp, ChevronDown, FileSpreadsheet } from 'lucide-react';
import gsap from 'gsap';
import ODManagerModal from './ODManagerModal';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [teams, setTeams] = useState<TeamRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState('');
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
  const [isODModalOpen, setIsODModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const data = await fetchAllTeams();
    setTeams(data);
    if (showLoading) setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isODModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isODModalOpen]);

  // Remove problematic GSAP animation for cards to allow CSS animations to handle initial load smoothly

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Animate the icon specifically
    gsap.to(".refresh-icon", { rotation: 360, duration: 1, repeat: -1, ease: "linear" });

    await loadData(false);

    gsap.killTweensOf(".refresh-icon");
    gsap.to(".refresh-icon", { rotation: 0, duration: 0.5 });
    setIsRefreshing(false);
  };

  const filteredTeams = teams.filter(t =>
    t.teamName.toLowerCase().includes(filter.toLowerCase()) ||
    t.leadName.toLowerCase().includes(filter.toLowerCase())
  );

  const totalHackers = teams.reduce((acc, team) => acc + (team.members.length + 1), 0);

  const renderLoader = () => (
    <div className="absolute inset-0 z-50 bg-[#020202]/80 backdrop-blur-sm flex items-center justify-center font-mono">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-[#00F0FF] border-t-transparent rounded-full animate-spin"></div>
        <p className="animate-pulse tracking-widest text-[#00F0FF]">ESTABLISHING UPLINK...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020202] text-white font-mono selection:bg-red-500 selection:text-white pb-20">
      {/* Top Bar */}
      <div className="fixed top-0 w-full bg-black/80 backdrop-blur-md border-b border-white/10 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="text-[#00F0FF]" />
          <span className="font-bold tracking-widest text-lg hidden md:inline">FLIGHT_CONTROL</span>
          <span className="px-2 py-0.5 bg-[#00F0FF]/10 text-[#00F0FF] text-[10px] rounded border border-[#00F0FF]/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-[#00F0FF] rounded-full animate-pulse"></span>
            LIVE
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsODModalOpen(true)}
            className="flex items-center gap-2 text-gray-400 hover:text-[#00F0FF] transition-colors text-xs uppercase tracking-wider"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden md:inline">Generate OD</span>
          </button>

          <div className="h-4 w-[1px] bg-white/10"></div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 text-gray-400 hover:text-[#00F0FF] transition-colors text-xs uppercase tracking-wider disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 refresh-icon ${isRefreshing ? '' : ''}`} />
            <span className="hidden md:inline">Sync Data</span>
          </button>

          <div className="h-4 w-[1px] bg-white/10"></div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-red-500 hover:text-white transition-colors text-xs uppercase tracking-wider"
          >
            <LogOut className="w-4 h-4" /> Disconnect
          </button>
        </div>
      </div>

      <div className="pt-24 px-6 md:px-12 max-w-7xl mx-auto space-y-8 relative min-h-[50vh]">
        {loading && renderLoader()}

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0A0A0A] border border-white/10 p-5 relative overflow-hidden group hover:border-[#00F0FF]/30 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Users className="w-10 h-10 text-[#00F0FF]" /></div>
            <h3 className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Total Teams</h3>
            <div className="text-3xl font-bold text-white flex items-baseline gap-2">
              {teams.length}
              <span className="text-[10px] text-green-500 font-normal">+12%</span>
            </div>
          </div>
          <div className="bg-[#0A0A0A] border border-white/10 p-5 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Cpu className="w-10 h-10 text-purple-500" /></div>
            <h3 className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Active Nodes</h3>
            <div className="text-3xl font-bold text-white">{totalHackers}</div>
          </div>
          <div className="bg-[#0A0A0A] border border-white/10 p-5 relative overflow-hidden group hover:border-yellow-500/30 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Database className="w-10 h-10 text-yellow-500" /></div>
            <h3 className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Last Sync</h3>
            <div className="text-lg font-bold text-white mt-2">Just Now</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00F0FF]/20 to-purple-600/20 rounded opacity-0 group-hover:opacity-100 transition duration-500 blur"></div>
          <div className="relative flex items-center bg-[#0A0A0A] border border-white/10 rounded">
            <Search className="absolute left-4 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search database by Team or Lead..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-transparent p-4 pl-12 text-white focus:outline-none placeholder-gray-600"
            />
            {filter && (
              <div className="absolute right-4 text-xs text-[#00F0FF]">
                {filteredTeams.length} RESULTS
              </div>
            )}
          </div>
        </div>

        {/* Data Grid */}
        <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          {filteredTeams.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-600 border border-dashed border-white/10 rounded">
              <Code2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="uppercase tracking-widest text-sm">No data packets found</p>
            </div>
          ) : (
            filteredTeams.map((team, index) => (
              <div
                key={team.id}
                style={{ animationDelay: `${index * 50}ms` }}
                className={`dashboard-card animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both relative bg-[#0A0A0A] border border-white/10 rounded overflow-hidden group hover:-translate-y-1 transition-all hover:shadow-[0_10px_30px_-10px_rgba(0,240,255,0.1)] ${index % 2 === 0 ? 'bg-white/[0.01]' : ''}`}
              >

                <div
                  className="p-5 border-b border-white/5 cursor-pointer flex justify-between items-center"
                  onClick={() => setExpandedTeams(prev => ({ ...prev, [team.id]: !prev[team.id] }))}
                >
                  <div className="truncate pr-4">
                    <h3 className="text-xl font-bold text-white group-hover:text-[#00F0FF] transition-colors truncate">{team.teamName}</h3>
                    <div className="text-[10px] text-gray-600 font-mono mt-1 flex items-center gap-2">
                      <span>ID: {team.id.substring(0, 8)}...</span>
                      <span>•</span>
                      <span>{new Date(team.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-white/50 hover:text-white transition-colors">
                    {expandedTeams[team.id] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  {/* Lead */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-[#00F0FF]/10 flex items-center justify-center text-[#00F0FF] text-xs font-bold border border-[#00F0FF]/30 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden space-y-1">
                      <div className="text-sm font-bold text-white truncate">{team.leadName}</div>
                      <div className="text-xs text-gray-500 truncate">{team.leadEmail}</div>
                      <div className="flex flex-wrap gap-2 text-[10px] text-gray-600 mt-1 uppercase">
                        <span className="bg-white/5 px-2 py-0.5 rounded">{team.leadRegNo || 'N/A'}</span>
                        <span className="bg-white/5 px-2 py-0.5 rounded">Dept: {team.leadDepartment || 'N/A'}</span>
                        <span className="bg-white/5 px-2 py-0.5 rounded">Sec: {team.leadSection || 'N/A'}</span>
                        <span className="bg-white/5 px-2 py-0.5 rounded">Sem: {team.leadSemester || 'N/A'}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1 flex gap-3">
                        <span>📞 {team.leadPhone || 'N/A'}</span>
                        <span className="truncate">✉️ {team.leadAltEmail || 'N/A'} (Alt)</span>
                      </div>
                    </div>
                  </div>

                  {/* Members (Only shown when expanded) */}
                  {expandedTeams[team.id] && (
                    <div className="space-y-2 pt-2 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                      <p className="text-[10px] uppercase text-gray-500 tracking-widest mb-1 flex justify-between">
                        <span>Engineers</span>
                        <span>{team.members.length}/3</span>
                      </p>

                      {team.members.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {team.members.map((member, i) => (
                            <div key={i} className="flex flex-col text-xs bg-white/5 p-3 rounded hover:bg-white/10 transition-colors gap-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 truncate">
                                  <div className="w-1.5 h-1.5 bg-gray-600 rounded-full"></div>
                                  <span className="text-gray-300 truncate font-bold">{member.name}</span>
                                </div>
                                <span className="text-gray-600 shrink-0 text-[10px] uppercase bg-white/5 px-1.5 py-0.5 rounded">Sem: {member.semester}</span>
                              </div>
                              <div className="ml-3.5 text-gray-500 truncate flex justify-between text-[10px]">
                                <span>{member.email}</span>
                                <span className="text-[#00F0FF]/50 uppercase">{member.role}</span>
                              </div>
                              <div className="ml-3.5 flex flex-wrap gap-1.5 text-[9px] text-gray-600 uppercase">
                                <span className="bg-black/30 border border-white/5 px-1.5 py-0.5 rounded">{member.regNo || 'N/A'}</span>
                                <span className="bg-black/30 border border-white/5 px-1.5 py-0.5 rounded">Dept: {member.department || 'N/A'}</span>
                                <span className="bg-black/30 border border-white/5 px-1.5 py-0.5 rounded">Sec: {member.section || 'N/A'}</span>
                              </div>
                              <div className="ml-3.5 text-[10px] text-gray-500 flex gap-3">
                                <span>📞 {member.phone || 'N/A'}</span>
                                <span className="truncate">✉️ {member.altEmail || 'N/A'} (Alt)</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[10px] uppercase text-gray-700 italic py-2 text-center border border-dashed border-white/5 rounded">
                          Solo Operation
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Hover Decoration */}
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>
            ))
          )}
        </div>
      </div>

      <ODManagerModal
        isOpen={isODModalOpen}
        onClose={() => setIsODModalOpen(false)}
        registrations={teams}
      />
    </div>
  );
};

export default AdminDashboard;