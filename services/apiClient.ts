/// <reference types="vite/client" />

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  'http://localhost:3000';

const SESSION_KEY = 'aerochain-session';

// --- Session helpers ---

interface AerochainSession {
  access_token: string;
  refresh_token: string;
  user: { id: string; email: string };
}

function saveSession(session: AerochainSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getStoredSession(): AerochainSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AerochainSession) : null;
  } catch {
    return null;
  }
}

export function getStoredUser(): AerochainSession['user'] | null {
  return getStoredSession()?.user ?? null;
}

function authHeaders(): Record<string, string> {
  const session = getStoredSession();
  if (!session) return { 'Content-Type': 'application/json' };
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}

// --- Auth ---

export const sendOtpToEmail = async (email: string) => {
  const res = await fetch(`${API_BASE}/api/aerochain/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const json = await res.json();
  return { data: json, error: res.ok ? null : new Error(json.error) };
};

export const verifyOtpToken = async (email: string, token: string) => {
  const res = await fetch(`${API_BASE}/api/aerochain/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token }),
  });
  const json = await res.json();

  if (!res.ok) {
    return { data: { user: null, session: null }, error: new Error(json.error) };
  }

  const session: AerochainSession = {
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    user: json.user,
  };
  saveSession(session);

  return { data: { user: json.user, session }, error: null };
};

export const signOut = async () => {
  clearSession();
  return { error: null };
};

export const validateSession = async (): Promise<AerochainSession['user'] | null> => {
  const session = getStoredSession();
  if (!session) return null;

  try {
    const res = await fetch(`${API_BASE}/api/aerochain/auth/me`, {
      headers: authHeaders(),
    });
    if (!res.ok) {
      clearSession();
      return null;
    }
    const json = await res.json();
    return json.user ?? null;
  } catch {
    return null;
  }
};

// --- Registration data ---

export const getMyRegistration = async (_userId: string, _email?: string) => {
  try {
    const res = await fetch(`${API_BASE}/api/aerochain/register`, {
      headers: authHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.registration ?? null;
  } catch {
    return null;
  }
};

export const submitRegistration = async (
  formData: any,
  _userId: string,
  existingId?: string,
) => {
  const res = await fetch(`${API_BASE}/api/aerochain/register`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ formData, existingId }),
  });
  const json = await res.json();
  return { data: json.data, error: res.ok ? null : new Error(json.error) };
};
