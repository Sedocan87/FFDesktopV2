import React from 'react';
import {
    HomeIcon, BriefcaseIcon, UsersIcon, FileTextIcon, ClockIcon,
    ChartBarIcon, DollarSignIcon, SettingsIcon, SunIcon, MoonIcon
} from './icons/index';

const NavLink = ({ view, icon, children, activeView, setActiveView, setActiveProject, setIsSidebarOpen }) => (
    <a
        href="#"
        onClick={(e) => {
            e.preventDefault();
            setActiveProject(null);
            setActiveView(view);
            if (setIsSidebarOpen) {
                setIsSidebarOpen(false);
            }
        }}
        className={`flex items-center px-4 py-2.5 rounded-lg transition-colors ${
            activeView === view
                ? 'bg-slate-900 text-white shadow dark:bg-slate-50 dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
    >
        {React.cloneElement(icon, { className: "w-5 h-5 mr-3" })}
        <span className="font-medium">{children}</span>
    </a>
);

const Sidebar = ({
    activeView,
    setActiveView,
    isLicensed,
    isTrialExpired,
    daysLeft,
    handlePurchase,
    isDarkMode,
    setIsDarkMode,
    setActiveProject,
    setIsSidebarOpen
}) => {
    const navLinkProps = { activeView, setActiveView, setActiveProject, setIsSidebarOpen };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b dark:border-slate-800">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-200">Zentie</h1>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                <NavLink view="dashboard" icon={<HomeIcon />} {...navLinkProps}>Dashboard</NavLink>
                <NavLink view="projects" icon={<BriefcaseIcon />} {...navLinkProps}>Projects</NavLink>
                <NavLink view="clients" icon={<UsersIcon />} {...navLinkProps}>Clients</NavLink>
                <NavLink view="timetracking" icon={<ClockIcon />} {...navLinkProps}>Time Tracking</NavLink>
                <NavLink view="invoices" icon={<FileTextIcon />} {...navLinkProps}>Invoices</NavLink>
                <NavLink view="expenses" icon={<DollarSignIcon />} {...navLinkProps}>Expenses</NavLink>
                <NavLink view="reporting" icon={<ChartBarIcon />} {...navLinkProps}>Reporting</NavLink>
            </nav>
            <div className="p-4 border-t dark:border-slate-800 space-y-2">
                {!isLicensed && (
                    <button
                        onClick={handlePurchase}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg transform transition-transform duration-200 hover:scale-105"
                    >
                        Buy License
                    </button>
                )}
                {!isLicensed && !isTrialExpired && (
                    <div className="p-2 text-center text-sm text-slate-500 dark:text-slate-400">
                        You have {daysLeft} days left in your trial.
                    </div>
                )}
                <NavLink view="settings" icon={<SettingsIcon />} {...navLinkProps}>Settings</NavLink>
                <div className="flex justify-between items-center p-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Local App</span>
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;