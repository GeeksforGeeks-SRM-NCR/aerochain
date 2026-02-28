/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { TeamRegistration } from '../types';

// Auth and registration functions are now delegated to the main site API.
// Only the admin-facing Supabase client is kept here for verifyAdmin / fetchAllTeams.
export {
  sendOtpToEmail,
  verifyOtpToken,
  signOut,
  getMyRegistration,
  submitRegistration,
  getStoredUser,
  validateSession,
  clearSession,
} from './apiClient';

// --- ADMIN (direct Supabase access, unchanged) ---

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  }
});

// --- ADMIN ---

export const verifyAdmin = async (id: string, pass: string): Promise<boolean> => {
  // Always allow the hardcoded admin credentials
  if (id === 'admin' && pass === 'aerochain2026') {
    return true;
  }

  try {
    const { data, error } = await supabase
      .from('admins')
      .select('id')
      .eq('username', id)
      .eq('password', pass)
      .single();

    if (error || !data) return false;
    return true;
  } catch (err) {
    return false;
  }
};

export const fetchAllTeams = async (): Promise<TeamRegistration[]> => {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching teams:", error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    teamName: item.team_name || item.teamName || '',
    leadName: item.lead_name || item.leadName || '',
    leadEmail: item.lead_email || item.leadEmail || '',
    leadSemester: item.lead_semester || item.leadSemester || '',
    leadRegNo: item.lead_reg_no || item.leadRegNo || '',
    leadPhone: item.lead_phone || item.leadPhone || '',
    leadSection: item.lead_section || item.leadSection || '',
    leadDepartment: item.lead_department || item.leadDepartment || '',
    leadAltEmail: item.lead_alt_email || item.leadAltEmail || '',
    members: item.members || [],
    submittedAt: item.created_at || item.createdAt || item.submittedAt || ''
  }));
};