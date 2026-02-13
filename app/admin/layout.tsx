import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Admin | OFFLAND',
    robots: {
        index: false,
        follow: false,
    },
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div style={{ minHeight: '100vh', background: '#1a1a1a' }}>
            {children}
        </div>
    );
}
