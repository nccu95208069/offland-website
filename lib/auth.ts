import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
    isLoggedIn: boolean;
    username?: string;
}

const sessionOptions = {
    password: process.env.SESSION_SECRET || 'fallback-password-must-be-at-least-32-characters-long',
    cookieName: 'offland-admin-session',
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax' as const,
        maxAge: 60 * 60 * 8, // 8 hours
    },
};

export async function getSession(): Promise<IronSession<SessionData>> {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    return session;
}

export async function isAuthenticated(): Promise<boolean> {
    const session = await getSession();
    return session.isLoggedIn === true;
}

// Simple in-memory rate limiter for login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts: number } {
    const now = Date.now();
    const record = loginAttempts.get(ip);

    if (!record) {
        return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
    }

    // Reset if lockout period has passed
    if (now - record.lastAttempt > LOCKOUT_DURATION) {
        loginAttempts.delete(ip);
        return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
    }

    if (record.count >= MAX_ATTEMPTS) {
        return { allowed: false, remainingAttempts: 0 };
    }

    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - record.count };
}

export function recordFailedAttempt(ip: string): void {
    const now = Date.now();
    const record = loginAttempts.get(ip);

    if (!record) {
        loginAttempts.set(ip, { count: 1, lastAttempt: now });
    } else {
        record.count += 1;
        record.lastAttempt = now;
    }
}

export function clearAttempts(ip: string): void {
    loginAttempts.delete(ip);
}
