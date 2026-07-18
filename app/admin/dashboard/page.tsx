// Offland 晨報頁（server component 守門）。Spec: docs/specs/admin-dashboard.md §6。
// 無 middleware：守門在 page 內做——未登入直接 redirect 到 login，帶 next 導回本頁。
// 通過後才 render client 元件（client 端再 fetch /api/admin/dashboard 取資料）。
import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import DashboardClient from './DashboardClient';

export const metadata = {
    title: 'Offland 晨報 | OFFLAND',
};

// session 是每次請求動態判定，不可靜態預渲染。
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    if (!(await isAuthenticated())) {
        redirect('/admin/login?next=/admin/dashboard');
    }
    return <DashboardClient />;
}
