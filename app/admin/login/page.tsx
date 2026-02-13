'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function AdminLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || '登入失敗');
                return;
            }

            router.push('/admin/blog');
        } catch {
            setError('網路錯誤，請稍後再試。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginCard}>
                <div className={styles.logoArea}>
                    <span className={styles.brand}>OFFLAND</span>
                    <span className={styles.subtitle}>管理後台</span>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label htmlFor="username">帳號</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="請輸入管理員帳號"
                            required
                            autoComplete="username"
                            autoFocus
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="password">密碼</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="請輸入密碼"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={loading}
                    >
                        {loading ? '登入中...' : '登 入'}
                    </button>
                </form>
            </div>
        </div>
    );
}
