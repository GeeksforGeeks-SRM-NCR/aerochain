import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle, AlertCircle, Loader2, User, BookOpen, Lock } from 'lucide-react';
import { submitRegistration } from '../services/supabaseClient';

interface RegistrationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminRequest: () => void;
  user: { id: string; email?: string };
  initialData?: any | null;
}

interface TeamMember {
  name: string;
  role: string;
  email: string;
  semester: string;
  regNo: string;
  phone: string;
  section: string;
  department: string;
  altEmail: string;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ isOpen, onClose, onAdminRequest, user, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const [formData, setFormData] = useState({
    teamName: '',
    leadName: '',
    leadEmail: user?.email || '', // Lock to auth email
    leadSemester: '',
    leadRegNo: '',
    leadPhone: '',
    leadSection: '', // Set default to empty
    leadDepartment: '', // Set default to empty
    leadAltEmail: '',
    members: [
      { name: '', role: 'Developer', email: '', semester: '', regNo: '', phone: '', section: '', department: '', altEmail: '' },
      { name: '', role: 'Developer', email: '', semester: '', regNo: '', phone: '', section: '', department: '', altEmail: '' }
    ] as TeamMember[]
  });

  // Load initial data if editing
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  // Load initial data if editing, or initialize for new user
  // CRITICAL FIX: Removed 'user' from dependency array to prevent form wipe on tab switch/auth refresh
  useEffect(() => {
    if (initialData) {
      // Ensure we have at least 2 members even if initialData has fewer
      const preppedMembers = [...(initialData.members || [])];
      while (preppedMembers.length < 2) {
        preppedMembers.push({ name: '', role: 'Developer', email: '', semester: '', regNo: '', phone: '', section: '', department: '', altEmail: '' });
      }

      setFormData({
        teamName: initialData.teamName || '',
        leadName: initialData.leadName || '',
        leadEmail: initialData.leadEmail || user.email || '', // Fallback to auth email if missing
        leadSemester: initialData.leadSemester || '',
        leadRegNo: initialData.leadRegNo || '',
        leadPhone: initialData.leadPhone || '',
        leadSection: initialData.leadSection || '',
        leadDepartment: initialData.leadDepartment || '',
        leadAltEmail: initialData.leadAltEmail || '',
        members: preppedMembers
      });
    } else if (isOpen) {
      // Only specific initialization for new forms
      setFormData(prev => {
        // Only set leadEmail if it's currently empty, otherwise allow user edits to persist
        if (!prev.leadEmail && user.email) {
          return { ...prev, leadEmail: user.email };
        }
        return prev;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isOpen]); // removed 'user' to persist data on re-renders

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);



  if (!isOpen) return null;

  const handleMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    const newMembers = [...formData.members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setFormData({ ...formData, members: newMembers });
  };

  const addMember = () => {
    if (formData.members.length < 3) {
      setFormData({
        ...formData,
        members: [...formData.members, { name: '', role: 'Developer', email: '', semester: '', regNo: '', phone: '', section: '', department: '', altEmail: '' }]
      });
    }
  };

  const removeMember = (index: number) => {
    if (formData.members.length <= 2) return; // Prevent lowering member count below 2
    const newMembers = formData.members.filter((_, i) => i !== index);
    setFormData({ ...formData, members: newMembers });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Form Validations
    const regNoRegex = /^RA\d{13}$/i;
    const phoneRegex = /^\d{10}$/;

    if (!regNoRegex.test(formData.leadRegNo.replace(/\s/g, ''))) {
      setError("Lead Reg No must start with RA followed by exactly 13 digits.");
      setLoading(false);
      return;
    }
    if (!phoneRegex.test(formData.leadPhone.replace(/\s/g, ''))) {
      setError("Lead Phone must be exactly 10 digits.");
      setLoading(false);
      return;
    }

    if (formData.members.length < 2 || formData.members.length > 3) {
      setError("Total team size must be between 3 and 4 members (Lead + 2-3 Crew members).");
      setLoading(false);
      return;
    }

    for (let i = 0; i < formData.members.length; i++) {
      const m = formData.members[i];
      if (!regNoRegex.test(m.regNo.replace(/\s/g, ''))) {
        setError(`Crew Member ${i + 1} Reg No must start with RA followed by exactly 13 digits.`);
        setLoading(false);
        return;
      }
      if (!phoneRegex.test(m.phone.replace(/\s/g, ''))) {
        setError(`Crew Member ${i + 1} Phone must be exactly 10 digits.`);
        setLoading(false);
        return;
      }
    }

    try {
      // Pass the user.id to handle the upsert logic, and initialData?.id for updates
      const { error } = await submitRegistration(formData, user.id, initialData?.id);

      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to transmit data to mainframe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-[#00F0FF]/30 rounded-xl shadow-[0_0_50px_rgba(0,240,255,0.15)] flex flex-col max-h-[80vh] my-auto">

        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#00F0FF]/5">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tighter text-white">
              {initialData ? 'UPDATE_REGISTRATION' : 'INITIALIZE_REGISTRATION'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-xs font-mono text-gray-400">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X />
          </button>
        </div>

        {/* Body */}
        <div
          className="p-8 overflow-y-auto hide-scrollbar flex-1 overscroll-contain"
          data-lenis-prevent
          onWheel={(e) => e.stopPropagation()} // Stop event bubbling just in case
        >
          {success ? (
            <div className="flex flex-col items-center justify-center text-center h-64 space-y-6">
              <CheckCircle className="w-16 h-16 text-[#00F0FF]" />
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">TRANSMISSION RECEIVED</h3>
                <p className="text-gray-400">Your application has been {initialData ? 'updated' : 'recorded'} in the system.</p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-[#00F0FF] text-black font-bold text-sm uppercase tracking-widest hover:bg-white transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 p-4 rounded text-red-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Step 1 */}
              <div className="space-y-4">
                <h3 className="text-sm font-mono text-gray-500 border-b border-white/10 pb-2 mb-4">
                  01 // NODE_PARAMETERS
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs uppercase tracking-widest text-gray-400">Team Name</label>
                    <input
                      required
                      type="text"
                      value={formData.teamName}
                      onChange={e => setFormData({ ...formData, teamName: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded p-3 text-white focus:border-[#00F0FF] focus:outline-none transition-colors"
                      placeholder="e.g. Null Pointers"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-4">
                <h3 className="text-sm font-mono text-gray-500 border-b border-white/10 pb-2 mb-4">
                  02 // LEAD_ENGINEER
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      <User className="w-3 h-3" /> Lead Name
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.leadName}
                      onChange={e => setFormData({ ...formData, leadName: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded p-3 text-white focus:border-[#00F0FF] focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-2 opacity-70">
                    <label className="text-xs uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      <Lock className="w-3 h-3 text-[#00F0FF]" /> Lead Email (Locked)
                    </label>
                    <input
                      readOnly
                      type="email"
                      value={formData.leadEmail}
                      className="w-full bg-white/5 border border-white/10 rounded p-3 text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-gray-400">
                      Registration Number
                    </label>
                    <input
                      required
                      type="text"
                      maxLength={15}
                      value={formData.leadRegNo}
                      onChange={e => setFormData({ ...formData, leadRegNo: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded p-3 text-white focus:border-[#00F0FF] focus:outline-none transition-colors uppercase font-mono"
                      placeholder="RAxxxxxxxxxxxxx"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-gray-400">
                      Phone Number
                    </label>
                    <input
                      required
                      type="text"
                      maxLength={10}
                      value={formData.leadPhone}
                      onChange={e => setFormData({ ...formData, leadPhone: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded p-3 text-white focus:border-[#00F0FF] focus:outline-none transition-colors font-mono"
                      placeholder="10 digits"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-gray-400">
                      Department
                    </label>
                    <select
                      required
                      value={formData.leadDepartment}
                      onChange={e => setFormData({ ...formData, leadDepartment: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded p-3 text-white focus:border-[#00F0FF] focus:outline-none transition-colors [&>option]:bg-black custom-scrollbar appearance-none"
                      style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'/%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                    >
                      <option value="" disabled>Select Department</option>
                      <option value="AIML">AIML</option>
                      <option value="CORE">CORE</option>
                      <option value="CLOUD">CLOUD</option>
                      <option value="CYBER">CYBER SECURITY</option>
                      <option value="DSBS">DSBS</option>
                      <option value="ECE">ECE</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-gray-400">
                        Section
                      </label>
                      <select
                        required
                        value={formData.leadSection}
                        onChange={e => setFormData({ ...formData, leadSection: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded p-3 text-white focus:border-[#00F0FF] focus:outline-none transition-colors [&>option]:bg-black custom-scrollbar appearance-none"
                        style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'/%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                      >
                        <option value="" disabled>Sec</option>
                        {Array.from({ length: 11 }, (_, i) => String.fromCharCode(65 + i)).map(char => (
                          <option key={char} value={char}>{char}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <BookOpen className="w-3 h-3" /> Semester
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.leadSemester}
                        onChange={e => setFormData({ ...formData, leadSemester: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded p-3 text-white focus:border-[#00F0FF] focus:outline-none transition-colors"
                        placeholder="e.g. 4th"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs uppercase tracking-widest text-gray-400">
                      Alternate Email ID
                    </label>
                    <input
                      required
                      type="email"
                      value={formData.leadAltEmail}
                      onChange={e => setFormData({ ...formData, leadAltEmail: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded p-3 text-white focus:border-[#00F0FF] focus:outline-none transition-colors"
                      placeholder="alternate@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-4">
                  <h3 className="text-sm font-mono text-gray-500">
                    03 // CREW_MEMBERS ({formData.members.length + 1}/4)
                  </h3>
                  {formData.members.length < 3 && (
                    <button
                      type="button"
                      onClick={addMember}
                      className="text-xs flex items-center gap-1 text-[#00F0FF] hover:text-white transition-colors bg-[#00F0FF]/10 px-3 py-1 rounded border border-[#00F0FF]/30"
                    >
                      <Plus className="w-3 h-3" /> ADD CREW
                    </button>
                  )}
                </div>

                {formData.members.map((member, idx) => (
                  <div key={idx} className="bg-white/5 p-4 rounded border border-white/5 relative group space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs font-mono text-[#00F0FF] uppercase">Crew Engineer {idx + 1}</h4>
                      {idx >= 2 && ( // Only allow deleting members beyond the minimum 2
                        <button
                          type="button"
                          onClick={() => removeMember(idx)}
                          className="p-1 text-red-500/50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-gray-500">Name</label>
                        <input
                          required
                          type="text"
                          value={member.name}
                          onChange={e => handleMemberChange(idx, 'name', e.target.value)}
                          className="w-full bg-transparent border-b border-white/20 pb-1 text-sm focus:border-[#00F0FF] outline-none text-white placeholder-white/20"
                          placeholder="Member Name"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-gray-500">Primary Email</label>
                        <input
                          required
                          type="email"
                          value={member.email}
                          onChange={e => handleMemberChange(idx, 'email', e.target.value)}
                          className="w-full bg-transparent border-b border-white/20 pb-1 text-sm focus:border-[#00F0FF] outline-none text-white placeholder-white/20"
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-gray-500">Registration Number</label>
                        <input
                          required
                          type="text"
                          maxLength={15}
                          value={member.regNo}
                          onChange={e => handleMemberChange(idx, 'regNo', e.target.value)}
                          className="w-full bg-transparent border-b border-white/20 pb-1 text-sm focus:border-[#00F0FF] outline-none text-white placeholder-white/20 uppercase font-mono"
                          placeholder="RAxxxxxxxxxxxxx"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-gray-500">Phone</label>
                        <input
                          required
                          type="text"
                          maxLength={10}
                          value={member.phone}
                          onChange={e => handleMemberChange(idx, 'phone', e.target.value)}
                          className="w-full bg-transparent border-b border-white/20 pb-1 text-sm focus:border-[#00F0FF] outline-none text-white placeholder-white/20 font-mono"
                          placeholder="10 digits"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-gray-500">Department</label>
                        <select
                          required
                          value={member.department}
                          onChange={e => handleMemberChange(idx, 'department', e.target.value)}
                          className="w-full bg-transparent border-b border-white/20 pb-1 text-sm focus:border-[#00F0FF] outline-none text-gray-300 [&>option]:bg-black appearance-none"
                          style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'/%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right center', backgroundSize: '1em' }}
                        >
                          <option value="" disabled>Select</option>
                          <option value="AIML">AIML</option>
                          <option value="CORE">CORE</option>
                          <option value="CLOUD">CLOUD</option>
                          <option value="CYBER">CYBER SECURITY</option>
                          <option value="DSBS">DSBS</option>
                          <option value="ECE">ECE</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-gray-500">Section</label>
                          <select
                            required
                            value={member.section}
                            onChange={e => handleMemberChange(idx, 'section', e.target.value)}
                            className="w-full bg-transparent border-b border-white/20 pb-1 text-sm focus:border-[#00F0FF] outline-none text-gray-300 [&>option]:bg-black appearance-none"
                            style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'/%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right center', backgroundSize: '1em' }}
                          >
                            <option value="" disabled>Sec</option>
                            {Array.from({ length: 11 }, (_, i) => String.fromCharCode(65 + i)).map(char => (
                              <option key={char} value={char}>{char}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-gray-500">Semester</label>
                          <input
                            required
                            type="text"
                            value={member.semester}
                            onChange={e => handleMemberChange(idx, 'semester', e.target.value)}
                            className="w-full bg-transparent border-b border-white/20 pb-1 text-sm focus:border-[#00F0FF] outline-none text-white placeholder-white/20"
                            placeholder="e.g. 2nd"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] uppercase text-gray-500">Alternate Email</label>
                        <input
                          required
                          type="email"
                          value={member.altEmail}
                          onChange={e => handleMemberChange(idx, 'altEmail', e.target.value)}
                          className="w-full bg-transparent border-b border-white/20 pb-1 text-sm focus:border-[#00F0FF] outline-none text-white placeholder-white/20"
                          placeholder="alternate@example.com"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-white/10">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full group relative flex items-center justify-center px-8 py-4 text-sm font-bold uppercase tracking-widest text-black bg-[#00F0FF] hover:bg-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> {initialData ? 'UPDATING...' : 'UPLOADING...'}
                    </span>
                  ) : (
                    <span className="relative z-10">{initialData ? 'OVERWRITE DATA' : 'CONFIRM DEPLOYMENT'}</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;