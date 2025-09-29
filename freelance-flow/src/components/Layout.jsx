import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children, sidebarProps }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // We pass setIsSidebarOpen to the sidebar so it can close itself on navigation
    const sidebarContent = <Sidebar {...sidebarProps} setIsSidebarOpen={setIsSidebarOpen} />;

    return (
        <>
            {/* Mobile Sidebar */}
            <div className={`fixed inset-0 z-40 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:hidden`}>
                {sidebarContent}
            </div>
            {isSidebarOpen && <div className="fixed inset-0 bg-black opacity-50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

            {/* Desktop Sidebar */}
            <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
                {sidebarContent}
            </div>

            <main className="md:pl-64 flex flex-col flex-1">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                {/* The main content is passed as children */}
                {children}
            </main>
        </>
    );
};

export default Layout;