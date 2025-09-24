import React, { useState, useMemo, useCallback } from 'react';
import useStore from '../store';
import Card from '../components/Card';
import Button from '../components/Button';
import { formatCurrency } from '../lib/utils';

const ReportingView = () => {
    const { projects, timeEntries, expenses, taxSettings } = useStore();
    const [filter, setFilter] = useState('all'); // 'week', 'month', 'all'

    const getFilteredEntries = useCallback(() => {
        const now = new Date();
        if (filter === 'all') return timeEntries;
        if (filter === 'month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return timeEntries.filter(entry => new Date(entry.date) >= startOfMonth);
        }
        if (filter === 'week') {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            return timeEntries.filter(entry => new Date(entry.date) >= startOfWeek);
        }
        return [];
    }, [timeEntries, filter]);

    const filteredEntries = getFilteredEntries();

    const projectMap = projects.reduce((acc, proj) => {
        acc[proj.id] = { name: proj.name, client: proj.client, billing: proj.billing, currency: proj.currency };
        return acc;
    }, {});

    // Time Analysis Calculations
    const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const billableAmountsByCurrency = filteredEntries.reduce((acc, entry) => {
        const project = projectMap[entry.projectId];
        if (project && project.billing.type === 'Hourly') {
            const rate = project.billing.rate || 0;
            const currency = project.currency || 'USD';
            acc[currency] = (acc[currency] || 0) + (entry.hours * rate);
        }
        return acc;
    }, {});
    const projectsWorkedOn = [...new Set(filteredEntries.map(entry => entry.projectId))].length;

    const hoursByProject = filteredEntries.reduce((acc, entry) => {
        const projectName = projectMap[entry.projectId]?.name || 'Unknown Project';
        acc[projectName] = (acc[projectName] || 0) + entry.hours;
        return acc;
    }, {});

    const hoursByClient = filteredEntries.reduce((acc, entry) => {
        const clientName = projectMap[entry.projectId]?.client || 'Unknown Client';
        acc[clientName] = (acc[clientName] || 0) + entry.hours;
        return acc;
    }, {});

    // Profitability Analysis Calculation (always 'All Time')
    const profitabilityData = useMemo(() => {
        return projects.map(project => {
            const projectTimeEntries = timeEntries.filter(t => t.projectId === project.id);
            const totalHours = projectTimeEntries.reduce((sum, t) => sum + t.hours, 0);

            let revenue = 0;
            if (project.billing.type === 'Hourly') {
                revenue = totalHours * (project.billing.rate || 0);
            } else { // Fixed Price
                revenue = project.budget || 0;
            }

            const laborCost = totalHours * taxSettings.internalCostRate;

            const expensesCost = expenses
                .filter(e => e.projectId === project.id && !e.isBillable)
                .reduce((sum, e) => sum + e.amount, 0);

            const totalCost = laborCost + expensesCost;

            const profit = revenue - totalCost;
            const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

            return { id: project.id, name: project.name, currency: project.currency, revenue, cost: totalCost, profit, margin };
        });
    }, [projects, timeEntries, expenses, taxSettings.internalCostRate]);

    return (
        <div>
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Reports</h1>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">Analyze your tracked time and earnings.</p>
                </div>
                <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <Button variant={filter === 'week' ? 'primary' : 'ghost'} onClick={() => setFilter('week')}>This Week</Button>
                    <Button variant={filter === 'month' ? 'primary' : 'ghost'} onClick={() => setFilter('month')}>This Month</Button>
                    <Button variant={filter === 'all' ? 'primary' : 'ghost'} onClick={() => setFilter('all')}>All Time</Button>
                </div>
            </div>

            <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Time Analysis ({filter.charAt(0).toUpperCase() + filter.slice(1)})</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Hours</h3>
                    <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">{totalHours.toFixed(2)}</p>
                </Card>
                 <Card>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Billable Amount</h3>
                    <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                        {Object.keys(billableAmountsByCurrency).length > 0 ? (
                           Object.entries(billableAmountsByCurrency).map(([currency, amount]) => (
                               <div key={currency}>{formatCurrency(amount, currency)}</div>
                           ))
                        ) : (
                            <div>{formatCurrency(0, 'USD')}</div>
                        )}
                    </div>
                </Card>
                 <Card>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Projects Worked On</h3>
                    <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">{projectsWorkedOn}</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <Card>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Hours by Project</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b dark:border-slate-800">
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Project</th>
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Total Hours</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-slate-800">
                                {Object.entries(hoursByProject).map(([name, hours]) => (
                                    <tr key={name}>
                                        <td className="p-4 font-medium">{name}</td>
                                        <td className="p-4 text-right font-mono">{hours.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
                <Card>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Hours by Client</h3>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b dark:border-slate-800">
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Client</th>
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Total Hours</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-slate-800">
                                {Object.entries(hoursByClient).map(([name, hours]) => (
                                    <tr key={name}>
                                        <td className="p-4 font-medium">{name}</td>
                                        <td className="p-4 text-right font-mono">{hours.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            <div className="mt-8">
                <Card>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Project Profitability (All Time)</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b dark:border-slate-800">
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Project</th>
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Revenue</th>
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Cost</th>
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Profit</th>
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Margin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-slate-800">
                                {profitabilityData.map(item => (
                                    <tr key={item.id}>
                                        <td className="p-4 font-medium">{item.name}</td>
                                        <td className="p-4 text-right font-mono">{formatCurrency(item.revenue, item.currency)}</td>
                                        <td className="p-4 text-right font-mono text-red-500">({formatCurrency(item.cost, item.currency)})</td>
                                        <td className={`p-4 text-right font-mono font-semibold ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(item.profit, item.currency)}
                                        </td>
                                        <td className={`p-4 text-right font-mono font-semibold ${item.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {item.margin.toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                         <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                            Note: Profit is calculated assuming a 1:1 exchange rate. Costs are calculated using expense values and an internal cost rate set in your default currency (USD), without conversion.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ReportingView;