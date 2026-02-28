/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { TeamRegistration } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'aerochain-auth-token',
  }
});

// --- OTP AUTHENTICATION ---

export const sendOtpToEmail = async (email: string) => {
  // Supabase Magic Link / OTP login
  const { data, error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      shouldCreateUser: true, // Create user if not exists
    }
  });
  return { data, error };
};

export const verifyOtpToken = async (email: string, token: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email'
  });

  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// --- DATA HANDLING ---

// Fix: explicit mapping of snake_case DB columns to camelCase JS props
export const getMyRegistration = async (userId: string, email?: string) => {
  let query = supabase.from('registrations').select('*');
  if (email) {
    query = query.or(`user_id.eq.${userId},lead_email.eq.${email}`);
  } else {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.limit(1);

  if (error) {
    console.error("Error fetching registration:", error);
    return null;
  }

  if (!data || data.length === 0) return null;

  const record = data[0];

  return {
    id: record.id,
    teamName: record.team_name || record.teamName || '',
    leadName: record.lead_name || record.leadName || '',
    leadEmail: record.lead_email || record.leadEmail || '',
    leadSemester: record.lead_semester || record.leadSemester || '',
    leadRegNo: record.lead_reg_no || record.leadRegNo || '',
    leadPhone: record.lead_phone || record.leadPhone || '',
    leadSection: record.lead_section || record.leadSection || '',
    leadDepartment: record.lead_department || record.leadDepartment || '',
    leadAltEmail: record.lead_alt_email || record.leadAltEmail || '',
    members: record.members || [],
    submittedAt: record.created_at || record.createdAt || record.submittedAt || ''
  };
};

export const submitRegistration = async (formData: any, userId: string, existingId?: string) => {
  // Fix: explicit mapping of camelCase JS props to snake_case DB columns
  const dbPayload = {
    user_id: userId,
    team_name: formData.teamName,       // JS: teamName -> DB: team_name
    // Auto-fallback track to AI incase DB still requires it
    track: 'AI',
    lead_name: formData.leadName,       // JS: leadName -> DB: lead_name
    lead_email: formData.leadEmail,     // JS: leadEmail -> DB: lead_email
    lead_semester: formData.leadSemester, // JS: leadSemester -> DB: lead_semester
    lead_reg_no: formData.leadRegNo,
    lead_phone: formData.leadPhone,
    lead_section: formData.leadSection,
    lead_department: formData.leadDepartment,
    lead_alt_email: formData.leadAltEmail,
    members: formData.members,
    team_size: formData.members.length + 1
  };

  if (existingId) {
    const { data, error } = await supabase
      .from('registrations')
      .update(dbPayload)
      .eq('id', existingId)
      .select();
    return { data, error };
  } else {
    // Check if email already exists
    const { data: existingData } = await supabase
      .from('registrations')
      .select('id')
      .eq('lead_email', formData.leadEmail)
      .limit(1);

    if (existingData && existingData.length > 0) {
      const { data, error } = await supabase
        .from('registrations')
        .update(dbPayload)
        .eq('id', existingData[0].id)
        .select();
      return { data, error };
    }

    // Fallback to upsert
    const { data, error } = await supabase
      .from('registrations')
      .upsert(dbPayload, { onConflict: 'user_id' })
      .select();

    return { data, error };
  }
};

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