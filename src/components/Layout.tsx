import React from 'react';
import { Link, Outlet } from '@tanstack/react-router';
import "./../index.css";

const Layout: React.FC = () => {
    const navItems = [
        { path: '/', label: 'Главная' },
        { path: '/matches', label: 'Матчи' },
        { path: '/teams', label: 'Команды' },
        { path: '/referees', label: 'Судьи' },
        { path: '/cities', label: 'Города' },
    ];

    return (
        <div className="layout">
            <aside className="sidebar">
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="sidebar-link"
                            activeProps={{ className: 'sidebar-link active' }}
                            inactiveProps={{ className: 'sidebar-link' }}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </aside>
            <main className="content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;