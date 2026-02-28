import React, { useMemo, useState } from 'react';
import {
    CheckSquare,
    Download,
    Search,
    Square,
    X,
    FileSpreadsheet
} from 'lucide-react';
import { TeamRegistration } from '../types';
import { exportODListExcel } from '../utils/exportODList';

interface ODManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    registrations: TeamRegistration[];
}

export default function ODManagerModal({ isOpen, onClose, registrations }: ODManagerModalProps) {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());

    // Search filter
    const displayedTeams = useMemo(() => {
        if (!searchTerm) return registrations;
        const lowerSearch = searchTerm.toLowerCase();
        return registrations.filter((team) => {
            return (
                team.teamName?.toLowerCase().includes(lowerSearch) ||
                team.leadName?.toLowerCase().includes(lowerSearch) ||
                team.leadEmail?.toLowerCase().includes(lowerSearch)
            );
        });
    }, [registrations, searchTerm]);

    const toggleTeam = (teamId: string) => {
        const next = new Set(selectedTeamIds);
        if (next.has(teamId)) {
            next.delete(teamId);
        } else {
            next.add(teamId);
        }
        setSelectedTeamIds(next);
    };

    const toggleAll = () => {
        if (selectedTeamIds.size === displayedTeams.length && displayedTeams.length > 0) {
            setSelectedTeamIds(new Set());
        } else {
            const next = new Set<string>(displayedTeams.map((t) => t.id));
            setSelectedTeamIds(next);
        }
    };

    const handleGenerateOD = async () => {
        if (selectedTeamIds.size === 0) {
            alert('No teams selected. Please select at least one team.');
            return;
        }

        const selectedRegistrations = registrations.filter((t) => selectedTeamIds.has(t.id));
        await exportODListExcel(selectedRegistrations, "AeroChain Hackathon 2026");
    };

    // Reset state when modal closes
    React.useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
            setSelectedTeamIds(new Set());
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>

            <div className="relative w-full max-w-5xl bg-[#0A0A0A] border border-[#00F0FF]/30 shadow-[0_0_50px_rgba(0,240,255,0.1)] rounded-sm overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-[#00F0FF]/20 bg-[#00F0FF]/5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3 text-[#00F0FF]">
                        <FileSpreadsheet className="w-5 h-5" />
                        <h2 className="font-mono font-bold tracking-widest text-sm uppercase">Generate OD List</h2>
                    </div>
                    <button onClick={onClose} className="text-[#00F0FF]/50 hover:text-[#00F0FF] transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col gap-6 overflow-hidden">
                    {/* Controls */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end shrink-0">
                        <div className="w-full md:w-1/2">
                            <label className="block text-xs font-mono text-[#00F0FF]/70 uppercase tracking-widest mb-2">Search Teams</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 w-4 h-4 text-[#00F0FF]/50" />
                                <input
                                    type="text"
                                    placeholder="Search by team, lead, email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-black/50 border border-[#00F0FF]/30 rounded text-[#00F0FF] p-2 pl-10 font-mono text-sm placeholder-[#00F0FF]/30 focus:outline-none focus:border-[#00F0FF] transition-colors"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleGenerateOD}
                            disabled={selectedTeamIds.size === 0}
                            className={`flex items-center gap-2 px-6 py-2 rounded font-mono text-sm uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${selectedTeamIds.size > 0
                                ? "bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-black font-bold shadow-[0_0_20px_rgba(0,240,255,0.4)]"
                                : "bg-white/5 text-white/30 border border-white/10 cursor-not-allowed"
                                }`}
                        >
                            <Download className="w-4 h-4" />
                            Generate OD ({selectedTeamIds.size})
                        </button>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                        <h3 className="font-mono text-xs text-white uppercase tracking-widest">
                            Eligible Teams
                        </h3>
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-white/60 font-mono">
                            {displayedTeams.length} Found
                        </span>
                    </div>

                    {/* Table Area */}
                    <div className="border border-white/10 rounded overflow-hidden bg-black/40 flex-1 flex flex-col min-h-[300px]">
                        {displayedTeams.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-center p-8">
                                <p className="text-white/40 font-mono text-sm uppercase">No teams found matching search.</p>
                            </div>
                        ) : (
                            <div className="overflow-auto flex-1">
                                <table className="w-full text-left border-collapse font-mono text-sm">
                                    <thead className="sticky top-0 z-10 bg-black/90 backdrop-blur-md ">
                                        <tr className="border-b border-white/10 text-xs font-bold text-white/60 uppercase tracking-wider">
                                            <th className="p-4 w-16 text-center">
                                                <button
                                                    onClick={toggleAll}
                                                    className="p-1 hover:bg-white/10 rounded transition-colors flex items-center justify-center mx-auto"
                                                >
                                                    {selectedTeamIds.size === displayedTeams.length && displayedTeams.length > 0 ? (
                                                        <CheckSquare className="w-4 h-4 text-[#00F0FF]" />
                                                    ) : (
                                                        <Square className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </th>
                                            <th className="p-4">Team Name</th>
                                            <th className="p-4">Lead</th>
                                            <th className="p-4">Members</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {displayedTeams.map((team) => {
                                            const isSelected = selectedTeamIds.has(team.id);
                                            return (
                                                <tr
                                                    key={team.id}
                                                    onClick={() => toggleTeam(team.id)}
                                                    className={`group transition-colors cursor-pointer ${isSelected ? "bg-[#00F0FF]/10 text-[#00F0FF]" : "text-gray-300 hover:bg-white/5"
                                                        }`}
                                                >
                                                    <td className="p-4 text-center">
                                                        {isSelected ? (
                                                            <CheckSquare className="w-4 h-4 text-[#00F0FF] mx-auto" />
                                                        ) : (
                                                            <Square className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors mx-auto" />
                                                        )}
                                                    </td>
                                                    <td className="p-4 font-bold">{team.teamName || "Individual"}</td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col">
                                                            <span>{team.leadName}</span>
                                                            <span className="text-[10px] opacity-60 truncate max-w-[200px]">{team.leadEmail}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="inline-flex py-0.5 px-2 bg-white/5 rounded text-[10px] border border-white/10 uppercase">
                                                            {team.members ? team.members.length : 0} Members
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
