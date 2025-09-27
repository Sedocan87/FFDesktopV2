import React from 'react';
import Card from '../components/Card';
import TaxEstimator from './TaxEstimator';
import { formatCurrency } from '../lib/utils';
import FAB from '../components/FAB';
import useStore from '../store';
import { FileTextIcon, BriefcaseIcon, ClockIcon, DollarSignIcon } from '../components/icons';


const DashboardView = ({ projects = [], clients = [], timeEntries = [], expenses = [], taxSettings = {}, currencySettings = {} }) => {
    const { setIsNewInvoiceDialogOpen, setIsNewProjectDialogOpen, setIsLogTimeDialogOpen, setIsAddExpenseDialogOpen, getInvoicesWithRecurring } = useStore();
    const allInvoices = getInvoicesWithRecurring();

    const fabActions = [
        {
            icon: <FileTextIcon className="w-6 h-6" />,
            onClick: () => setIsNewInvoiceDialogOpen(true),
        },
        {
            icon: <BriefcaseIcon className="w-6 h-6" />,
            onClick: () => setIsNewProjectDialogOpen(true),
        },
        {
            icon: <ClockIcon className="w-6 h-6" />,
            onClick: () => setIsLogTimeDialogOpen(true),
        },
        {
            icon: <DollarSignIcon className="w-6 h-6" />,
            onClick: () => setIsAddExpenseDialogOpen(true),
        },
    ];

    const projectsWithData = projects.filter(p => p && !p.isArchived);
    const totalProjects = projectsWithData.length;
    const totalClients = clients.filter(c => c && !c.isArchived).length;
    const projectMap = projectsWithData.reduce((acc, proj) => {
        acc[proj.id] = proj.name;
        return acc;
    }, {});

    const currentYear = new Date().getFullYear();
    const ytdRevenue = allInvoices
        .filter(i => i.status === 'Paid' && new Date(i.issueDate).getFullYear() === currentYear)
        .reduce((acc, i) => {
            const taxRate = taxSettings.rate / 100;
            let totalAmount;
            if (taxSettings.inclusive) {
                totalAmount = i.amount;
            } else {
                totalAmount = i.amount * (1 + taxRate);
            }
            return acc + totalAmount;
        }, 0);

    const outstandingInvoices = allInvoices
        .filter(i => i.status === 'Draft' || i.status === 'Overdue')
        .reduce((acc, i) => {
            const taxRate = taxSettings.rate / 100;
            let totalAmount;
            if (taxSettings.inclusive) {
                totalAmount = i.amount;
            } else {
                totalAmount = i.amount * (1 + taxRate);
            }
            return acc + totalAmount;
        }, 0);

    const recentActivities = [
        ...timeEntries.slice(0, 3).map(t => ({ type: 'time', data: t, date: t.date })),
        ...allInvoices.slice(0, 2).map(i => ({ type: 'invoice', data: i, date: i.issueDate }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));


    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">Welcome back! Here's a summary of your activity.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <Card>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Projects</h3>
                    <div className="flex justify-center">
                        <p className="mt-1 text-5xl font-bold text-slate-900 dark:text-white">{totalProjects}</p>
                    </div>
                </Card>
                 <Card>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Clients</h3>
                    <div className="flex justify-center">
                        <p className="mt-1 text-5xl font-bold text-slate-900 dark:text-white">{totalClients}</p>
                    </div>
                </Card>
                <Card>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">YTD Revenue</h3>
                    <div className="flex justify-center">
                        <p className="mt-1 text-5xl font-bold text-slate-900 dark:text-white">{formatCurrency(ytdRevenue, currencySettings.default)}</p>
                    </div>
                </Card>
                <Card>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Outstanding Invoices</h3>
                    <div className="flex justify-center">
                        <p className="mt-1 text-5xl font-bold text-slate-900 dark:text-white">{formatCurrency(outstandingInvoices, currencySettings.default)}</p>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                <div className="lg:col-span-1">
                    <TaxEstimator invoices={allInvoices} taxSettings={taxSettings} currencySettings={currencySettings} />
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Recent Activity</h3>
                        <ul className="divide-y dark:divide-slate-800">
                            {recentActivities.slice(0, 5).map((activity, index) => (
                                <li key={index} className="py-3 flex justify-between items-center">
                                    {activity.type === 'time' && (
                                        <>
                                            <div>
                                                <p className="font-medium text-slate-800 dark:text-slate-100">Logged {activity.data.hours?.toFixed(1)} hours on <span className="font-semibold">{projectMap[activity.data.project_id]}</span></p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{activity.data.description}</p>
                                            </div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{activity.date}</p>
                                        </>
                                    )}
                                    {activity.type === 'invoice' && (
                                        <>
                                            <div>
                                                <p className="font-medium text-slate-800 dark:text-slate-100">Invoice <span className="font-semibold">{activity.data.id}</span> created for <span className="font-semibold">{activity.data.clientName}</span></p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Amount: {formatCurrency(activity.data.amount, activity.data.currency)}</p>
                                            </div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{activity.date}</p>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </div>
            <FAB actions={fabActions} />
        </div>
    );
};

export default DashboardView;