import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function AppLayout() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
            <Navbar />
            <div className="app-shell">
                <Sidebar />
                <main className="page-content fade-in">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
