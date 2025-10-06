import React, { useState, useEffect, useMemo } from 'react';
import useStore from './store';
import { invoke } from '@tauri-apps/api/core';

// --- UI Components ---
import Toast from './components/Toast';
import Layout from './components/Layout';
import {
    BriefcaseIcon, FileTextIcon, ClockIcon, DollarSignIcon
} from './components/icons/index';

// --- Views ---
// A comment to force a reload
import DashboardView from './views/DashboardView';
import ProjectsView from './views/ProjectsView';
import ClientsView from './views/ClientsView';
import InvoicesView from './views/InvoicesView';
import TimeTrackingView from './views/TimeTrackingView';
import ReportingView from './views/ReportingView';
import ExpensesView from './views/ExpensesView';
import SettingsView from './views/SettingsView';
import NewInvoiceDialog from './views/NewInvoiceDialog';
import NewProjectDialog from './views/NewProjectDialog';
import LogTimeDialog from './views/LogTimeDialog';
import AddExpenseDialog from './views/AddExpenseDialog';
import KanbanView from './views/KanbanView';
import InvoiceStudioView from './views/InvoiceStudioView';

import FAB from './components/FAB';

import TrialExpiredView from './views/TrialExpiredView';

const MainApp = ({ isLicensed, isTrialExpired, daysLeft }) => {
    const [activeView, setActiveView] = useState('dashboard');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    const {
        clients, projects, timeEntries, invoices, expenses, userProfile,
        recurringInvoices, taxSettings, currencySettings, profitabilitySettings,
        isLoading, isTimerRunning, timerStartTime, elapsedTime, timerProjectId,
        setIsTimerRunning, setTimerStartTime, setElapsedTime, setTimerProjectId,
        loadInitialData, setIsNewInvoiceDialogOpen, setIsNewProjectDialogOpen,
        setIsLogTimeDialogOpen, setIsAddExpenseDialogOpen,
        activeProject,
        setActiveProject
    } = useStore();

    const showToast = (message) => {
        setToastMessage(message);
    };

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    useEffect(() => {
        const activeProjects = projects.filter(p => !p.isArchived);
        if (activeProjects.length > 0 && (!timerProjectId || !activeProjects.some(p => p.id === timerProjectId))) {
            setTimerProjectId(activeProjects[0].id);
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

    const handleExportData = async () => {
        try {
            const data = await invoke('export_database');
            const blob = new Blob([new Uint8Array(data)], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `zentie_backup_${new Date().toISOString().split('T')[0]}.db`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast("Database exported successfully!");
        } catch (error) {
            console.error('Failed to export database:', error);
            showToast("Failed to export database.");
        }
    };

    const handleImport = async (file) => {
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const data = new Uint8Array(e.target.result);
                await invoke('import_database', { data: Array.from(data) });
                showToast("Database imported successfully! The page will now reload.");
                setTimeout(() => window.location.reload(), 1500);
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error('Failed to import database:', error);
            showToast("Failed to import database.");
        }
    };

    const handlePurchase = () => {
        // Replace with your Lemon Squeezy product URL
        window.open('https://www.lemonsqueezy.com/buy/your-product-id', '_blank');
    };

    const clientProjectCounts = useMemo(() => {
        const clientNameMap = clients.reduce((acc, client) => {
            acc[client.id] = client.name;
            return acc;
        }, {});

        return projects.reduce((acc, project) => {
            const clientName = clientNameMap[project.clientId];
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
            case 'dashboard': return <DashboardView />;
            case 'projects': return <ProjectsView showToast={showToast} />;
            case 'clients': return <ClientsView showToast={showToast} clientProjectCounts={clientProjectCounts} />;
            case 'invoices': return <InvoicesView showToast={showToast} />;
            case 'timetracking': return <TimeTrackingView showToast={showToast} />;
            case 'reporting': return <ReportingView />;
            case 'expenses': return <ExpensesView showToast={showToast} />;
            case 'settings': return <SettingsView showToast={showToast} onImport={handleImport} onExport={handleExportData} />;

            default: return <DashboardView />;
        }
    };

    const fabActions = [
        {
            icon: <FileTextIcon className="w-6 h-6" />,
            label: 'New Invoice',
            onClick: () => setIsNewInvoiceDialogOpen(true),
        },
        {
            icon: <BriefcaseIcon className="w-6 h-6" />,
            label: 'New Project',
            onClick: () => setIsNewProjectDialogOpen(true),
        },
        {
            icon: <ClockIcon className="w-6 h-6" />,
            label: 'Log Time',
            onClick: () => setIsLogTimeDialogOpen(true),
        },
        {
            icon: <DollarSignIcon className="w-6 h-6" />,
            label: 'Add Expense',
            onClick: () => setIsAddExpenseDialogOpen(true),
        },
    ];

    const sidebarProps = {
        activeView,
        setActiveView,
        isLicensed,
        isTrialExpired,
        daysLeft,
        handlePurchase,
        isDarkMode,
        setIsDarkMode,
        setActiveProject,
    };

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

            <Layout sidebarProps={sidebarProps}>
                <div className="p-4 sm:p-6 lg:p-8">
                    {activeProject ? <KanbanView /> : renderView()}
                </div>
            </Layout>

            <NewInvoiceDialog showToast={showToast} />
            <NewProjectDialog showToast={showToast} />
            <LogTimeDialog showToast={showToast} />
            <AddExpenseDialog showToast={showToast} />
            <FAB actions={fabActions} disabled={!isLicensed && isTrialExpired} />
        </div>
    );
}

import LicenseGate from './components/LicenseGate';

const App = () => {
    return (
        <LicenseGate>
            <MainApp />
        </LicenseGate>
    );
}

export default App;
