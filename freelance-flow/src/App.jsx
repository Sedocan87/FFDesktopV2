import React, { useState, useEffect, useMemo } from 'react';
import useStore from './store';

// --- UI Components ---
import Toast from './components/Toast';
import {
    HomeIcon, BriefcaseIcon, UsersIcon, FileTextIcon, ClockIcon,
    ChartBarIcon, DollarSignIcon, SettingsIcon, SunIcon, MoonIcon,
    MenuIcon
} from './components/icons/index';

// --- Views ---
import DashboardView from './views/DashboardView';
import ProjectsView from './views/ProjectsView';
import ClientsView from './views/ClientsView';
import InvoicesView from './views/InvoicesView';
import TimeTrackingView from './views/TimeTrackingView';
import ReportingView from './views/ReportingView';
import ExpensesView from './views/ExpensesView';
import SettingsView from './views/SettingsView';

const App = () => {
    const [activeView, setActiveView] = useState('dashboard');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    const {
        clients, projects, timeEntries, invoices, expenses, userProfile,
        recurringInvoices, taxSettings, currencySettings,
        isLoading, isTimerRunning, timerStartTime, elapsedTime, timerProjectId,
        setData, setClients, setProjects, setTimeEntries, setInvoices, setExpenses,
        setUserProfile, setRecurringInvoices, setTaxSettings, setCurrencySettings,
        setIsTimerRunning, setTimerStartTime, setElapsedTime, setTimerProjectId,
        loadInitialData
    } = useStore();

    const showToast = (message) => {
        setToastMessage(message);
    };

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    useEffect(() => {
        if (projects.length > 0 && !timerProjectId) {
            setTimerProjectId(projects[0].id);
        }
    }, [projects, timerProjectId, setTimerProjectId]);

    useEffect(() => {
        let interval = null;
        if (isTimerRunning && timerStartTime) {
            interval = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - timerStartTime) / 1000));
            }, 1000);
        }
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isTimerRunning, timerStartTime, setElapsedTime]);
    
     useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);
    
    const handleExportData = () => {
        const dataToExport = {
            clients,
            projects,
            timeEntries,
            invoices,
            expenses,
            userProfile,
            recurringInvoices,
            taxSettings,
            currencySettings,
        };
        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `freelanceflow_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast("Data exported successfully!");
    };

    const handleImport = (importedData) => {
        setData(importedData);
        showToast("Data imported successfully! The page will now reload.");
        setTimeout(() => window.location.reload(), 1500);
    };

    const NavLink = ({ view, icon, children }) => (
        <a
            href="#"
            onClick={(e) => {
                e.preventDefault();
                setActiveView(view);
                setIsSidebarOpen(false);
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
    
    const clientProjectCounts = useMemo(() => {
        const clientNameMap = clients.reduce((acc, client) => {
            acc[client.id] = client.name;
            return acc;
        }, {});

        return projects.reduce((acc, project) => {
            const clientName = clientNameMap[project.client_id];
            if (clientName) {
                acc[clientName] = (acc[clientName] || 0) + 1;
            }
            return acc;
        }, {});
    }, [projects, clients]);

    const renderView = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-64"><p className="text-xl text-slate-500">Loading your data...</p></div>;
        }
        
        switch (activeView) {
            case 'dashboard': return <DashboardView 
                projects={projects}
                clients={clients}
                timeEntries={timeEntries}
                invoices={invoices}
                taxSettings={taxSettings}
                currencySettings={currencySettings}
            />;
            case 'projects': return <ProjectsView showToast={showToast} />;
            case 'clients': return <ClientsView showToast={showToast} clientProjectCounts={clientProjectCounts} />;
            case 'invoices': return <InvoicesView showToast={showToast} />;
            case 'timetracking': return <TimeTrackingView showToast={showToast} />;
            case 'reporting': return <ReportingView 
                projects={projects}
                timeEntries={timeEntries}
                expenses={expenses}
                taxSettings={taxSettings}
            />;
            case 'expenses': return <ExpensesView showToast={showToast} />;
            case 'settings': return <SettingsView showToast={showToast} onImport={handleImport} onExport={handleExportData} />;
            default: return <DashboardView 
                projects={projects}
                clients={clients}
                timeEntries={timeEntries}
                invoices={invoices}
                taxSettings={taxSettings}
                currencySettings={currencySettings}
            />;
        }
    };
    
    const sidebarContent = (
         <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b dark:border-slate-800">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-200">FreelanceFlow</h1>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                <NavLink view="dashboard" icon={<HomeIcon />}>Dashboard</NavLink>
                <NavLink view="projects" icon={<BriefcaseIcon />}>Projects</NavLink>
                <NavLink view="clients" icon={<UsersIcon />}>Clients</NavLink>
                <NavLink view="timetracking" icon={<ClockIcon />}>Time Tracking</NavLink>
                <NavLink view="invoices" icon={<FileTextIcon />}>Invoices</NavLink>
                <NavLink view="expenses" icon={<DollarSignIcon />}>Expenses</NavLink>
                <NavLink view="reporting" icon={<ChartBarIcon />}>Reporting</NavLink>
            </nav>
            <div className="p-4 border-t dark:border-slate-800 space-y-2">
                 <NavLink view="settings" icon={<SettingsIcon />}>Settings</NavLink>
                <div className="flex justify-between items-center p-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Local App</span>
                     <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {isDarkMode ? <SunIcon className="w-5 h-5"/> : <MoonIcon className="w-5 h-5"/>}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-50`}>
             <style>{`
                .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
                .animate-scale-in { animation: scaleIn 0.3s ease-out forwards; }
                .animate-toast-in { animation: toastIn 0.5s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                @keyframes toastIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
            
            {toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />}
            
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
                {/* Header for mobile */}
                <header className="md:hidden sticky top-0 bg-white dark:bg-slate-900 border-b dark:border-slate-800 p-4 flex items-center justify-between z-20">
                    <button onClick={() => setIsSidebarOpen(true)}>
                        <MenuIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-200">FreelanceFlow</h1>
                    <div className="w-6"></div>
                </header>

                <div className="p-4 sm:p-6 lg:p-8">
                    {renderView()}
                </div>
            </main>
        </div>
    );
};


export default App;