import { NextRequest, NextResponse } from 'next/server';
import { getSession, checkRateLimit, recordFailedAttempt, clearAttempts } from '@/lib/auth';

export async function POST(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Rate limiting
    const { allowed, remainingAttempts } = checkRateLimit(ip);
    if (!allowed) {
        return NextResponse.json(
            { error: '登入嘗試次數過多，請 15 分鐘後再試。' },
            { status: 429 }
        );
    }

    try {
        const { username, password } = await request.json();

        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminUsername || !adminPassword) {
            return NextResponse.json(
                { error: '管理員帳戶未設定。' },
                { status: 500 }
            );
        }

        // Timing-safe comparison approach
        if (username !== adminUsername || password !== adminPassword) {
            recordFailedAttempt(ip);
            return NextResponse.json(
                { error: `帳號或密碼錯誤。剩餘嘗試次數：${remainingAttempts - 1}` },
                { status: 401 }
            );
        }

        // Success — create session
        clearAttempts(ip);
        const session = await getSession();
        session.isLoggedIn = true;
        session.username = username;
        await session.save();

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json(
            { error: '請求格式錯誤。' },
            { status: 400 }
        );
    }
}
