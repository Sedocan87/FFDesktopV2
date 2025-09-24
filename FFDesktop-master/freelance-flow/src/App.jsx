import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { invoke } from '@tauri-apps/api/core';
import { CSS } from '@dnd-kit/utilities';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- ICONS (as inline SVG components for simplicity) ---
const HomeIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const BriefcaseIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const UsersIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const FileTextIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
);

const ClockIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const ChartBarIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 12h4v4H7z" />
        <path d="M12 8h4v8h-4z" />
        <path d="M17 4h4v12h-4z" />
    </svg>
);

const DollarSignIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
);

const EditIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const TrashIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
);


const SettingsIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15-.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const SunIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
    </svg>
);

const MoonIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
);

const MenuIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" />
    </svg>
);

const XIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
);

const RepeatIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m17 2 4 4-4 4" />
        <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
        <path d="m7 22-4-4 4-4" />
        <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
);


// --- MOCK DATA, CONSTANTS & HELPERS ---
const CURRENCIES = [
    { code: 'USD', name: 'US Dollar', symbol: '$', symbolPosition: 'before' },
    { code: 'EUR', name: 'Euro', symbol: '€', symbolPosition: 'after' },
    { code: 'GBP', name: 'British Pound', symbol: '£', symbolPosition: 'before' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', symbolPosition: 'before' },
    { code: 'AUD', name: 'Australian Dollar', symbol: '$', symbolPosition: 'before' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: '$', symbolPosition: 'before' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', symbolPosition: 'before' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', symbolPosition: 'before' },
];

const formatCurrency = (amount, currencyCode = 'USD') => {
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
        }).format(amount);
    } catch (e) {
        // Fallback for invalid currency codes
        const currency = CURRENCIES.find(c => c.code === currencyCode);
        return `${currency ? currency.symbol : '$'}${amount.toFixed(2)}`;
    }
};

const initialClients = [
    { id: 1, name: 'Innovate Inc.', email: 'contact@innovate.com' },
    { id: 2, name: 'Quantum Solutions', email: 'hello@quantum.dev' },
    { id: 3, name: 'Apex Designs', email: 'support@apexdesigns.io' },
    { id: 4, name: 'New Client', email: 'new@client.com' },
];

const initialProjects = [
    { id: 1, name: 'Mobile App Redesign', client: 'Apex Designs', status: 'In Progress', tracked: 25.5, billing: { type: 'Hourly', rate: 120 }, budget: null, currency: 'USD' },
    { id: 2, name: 'E-commerce Platform', client: 'Innovate Inc.', status: 'Completed', tracked: 120, billing: { type: 'Fixed Price'}, budget: 15000, currency: 'USD' },
    { id: 3, name: 'Marketing Website', client: 'Innovate Inc.', status: 'In Progress', tracked: 12.0, billing: { type: 'Hourly', rate: 90 }, budget: null, currency: 'EUR' },
    { id: 4, name: 'Data Analytics Dashboard', client: 'Quantum Solutions', status: 'Planning', tracked: 5.2, billing: { type: 'Hourly', rate: 150 }, budget: null, currency: 'USD' },
    { id: 5, name: 'Brand Identity', client: 'Apex Designs', status: 'Completed', tracked: 40.0, billing: { type: 'Fixed Price'}, budget: 5000, currency: 'GBP' },
    { id: 6, name: 'Internal CRM', client: 'Apex Designs', status: 'On Hold', tracked: 0, billing: { type: 'Hourly', rate: 100 }, budget: null, currency: 'USD' },
];

const initialTimeEntries = [
    { id: 1, projectId: 1, hours: 2.5, date: '2025-09-18', description: 'Worked on UI mockups for the home screen.', isBilled: false },
    { id: 2, projectId: 3, hours: 4.0, date: '2025-09-18', description: 'Initial project setup and dependency installation.', isBilled: false },
    { id: 3, projectId: 1, hours: 3.0, date: '2025-09-17', description: 'Client meeting to discuss feedback on wireframes.', isBilled: false },
    { id: 4, projectId: 2, hours: 8.0, date: '2025-07-16', description: 'Deployed final version to production.', isBilled: true },
    { id: 5, projectId: 4, hours: 5.2, date: '2025-08-15', description: 'Initial data modeling.', isBilled: false },
    { id: 6, projectId: 3, hours: 3.5, date: '2025-09-12', description: 'Set up staging environment.', isBilled: false },
    { id: 7, projectId: 1, hours: 5.0, date: '2025-09-11', description: 'Component library research.', isBilled: false },
];

const initialInvoices = [
    { id: 'INV-001', clientName: 'Innovate Inc.', issueDate: '2025-07-17', dueDate: '2025-08-17', amount: 950.00, status: 'Paid', currency: 'USD', items: []},
    { id: 'INV-002', clientName: 'Quantum Solutions', issueDate: '2025-08-20', dueDate: '2025-09-20', amount: 780.00, status: 'Paid', currency: 'USD', items: []},
];

const initialExpenses = [
    { id: 1, projectId: 1, description: 'Stock Photos License', amount: 75.00, date: '2025-09-10', isBilled: false, isBillable: true },
    { id: 2, projectId: 3, description: 'Premium WordPress Plugin', amount: 59.99, date: '2025-09-12', isBilled: false, isBillable: true },
    { id: 3, projectId: 2, description: 'Server Hosting (Q3)', amount: 150.00, date: '2025-07-01', isBilled: true, isBillable: true },
    { id: 4, projectId: 1, description: 'New Keyboard', amount: 120.00, date: '2025-09-15', isBilled: false, isBillable: false },
];

const initialUserProfile = {
    companyName: 'Your Company',
    companyEmail: 'your.email@example.com',
    companyAddress: '123 Freelance St, Work City',
    logo: null,
};

const initialRecurringInvoices = [
    { id: 1, clientName: 'Innovate Inc.', frequency: 'Monthly', nextDueDate: '2025-10-01', amount: 2500, items: [{ description: 'Monthly Marketing Retainer', amount: 2500 }], currency: 'USD' },
    { id: 2, clientName: 'Apex Designs', frequency: 'Quarterly', nextDueDate: '2025-11-15', amount: 750, items: [{ description: 'Quarterly Website Maintenance', amount: 750 }], currency: 'GBP' },
];

const initialTaxSettings = {
    rate: 25,
    internalCostRate: 50, // Default internal cost per hour for profitability
};

const initialCurrencySettings = {
    default: 'USD',
    invoiceLanguage: 'en',
};



// --- CUSTOM HOOKS ---



// --- REUSABLE UI COMPONENTS (shadcn/ui inspired) ---

const Card = ({ children, className = '', ...props }) => (
    <div {...props} className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 ${className}`}>
        {children}
    </div>
);

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-white dark:ring-offset-slate-950 px-4 py-2";
  const variants = {
    primary: "bg-slate-900 text-slate-50 hover:bg-slate-900/90 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80",
    destructive: "bg-red-500 text-slate-50 hover:bg-red-500/90 dark:bg-red-900 dark:text-red-50 dark:hover:bg-red-900/90",
    ghost: "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50",
  };
  return <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

const Input = ({ className = '', ...props }) => (
    <input
        className={`flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 dark:placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:ring-offset-slate-950 ${className}`}
        {...props}
    />
);

const Select = ({ children, className = '', ...props }) => (
    <select
        className={`w-full h-10 px-3 py-2 bg-transparent border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 appearance-none bg-no-repeat bg-right pr-8 ${className}`}
        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
        {...props}
    >
        {children}
    </select>
);

const Textarea = ({ className = '', ...props }) => (
    <textarea
        className={`flex min-h-[80px] w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        rows="3"
        {...props}
    />
);


const Label = ({ children, htmlFor, className = '' }) => (
    <label htmlFor={htmlFor} className={`block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ${className}`}>
        {children}
    </label>
);

const Dialog = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in" 
          onClick={onClose}
        >
            <div 
              className="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg m-4 animate-scale-in" 
              onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b dark:border-slate-800">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

const BillableItemsModal = ({ isOpen, onClose, unbilledEntries, unbilledExpenses, onCreateInvoice, currency }) => {
    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        if (isOpen) {
            // Pre-select all items when modal opens
            const allItems = [
                ...unbilledEntries.map(entry => ({ ...entry, type: 'time' })),
                ...unbilledExpenses.map(expense => ({ ...expense, type: 'expense' }))
            ];
            setSelectedItems(allItems);
        }
    }, [isOpen, unbilledEntries, unbilledExpenses]);

    const handleSelectItem = (item, type) => {
        setSelectedItems(prevSelectedItems => {
            const isSelected = prevSelectedItems.some(i => i.id === item.id && i.type === type);
            if (isSelected) {
                return prevSelectedItems.filter(i => !(i.id === item.id && i.type === type));
            } else {
                return [...prevSelectedItems, { ...item, type }];
            }
        });
    };

    const handleCreateInvoice = () => {
        const selectedEntries = selectedItems.filter(i => i.type === 'time').map(({ type, ...rest }) => rest);
        const selectedExpenses = selectedItems.filter(i => i.type === 'expense').map(({ type, ...rest }) => rest);
        onCreateInvoice(selectedEntries, selectedExpenses);
    };

    const totalSelectedAmount = useMemo(() => {
        return selectedItems.reduce((sum, item) => {
            if (item.type === 'time') {
                 return sum + (item.hours * item.rate);
            }
            return sum + item.amount;
        }, 0);
    }, [selectedItems]);


    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Select Items to Invoice">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {unbilledEntries.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Unbilled Time</h3>
                        <div className="border dark:border-slate-700 rounded-md p-2 space-y-1">
                            {unbilledEntries.map(entry => {
                                const rate = entry.rate;
                                const checkId = `time-check-${entry.id}`;
                                return (
                                    <div key={`time-${entry.id}`} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                                        <div className="flex items-center flex-grow">
                                            <input
                                                id={checkId}
                                                type="checkbox"
                                                checked={selectedItems.some(i => i.id === entry.id && i.type === 'time')}
                                                onChange={() => handleSelectItem(entry, 'time')}
                                                className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500 mr-3"
                                            />
                                            <label htmlFor={checkId} className="flex-grow cursor-pointer">
                                                <p>{entry.description || 'Work done'} on {entry.date}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{entry.hours.toFixed(2)} hours at {formatCurrency(rate, currency)}/hr</p>
                                            </label>
                                        </div>
                                        <p className="font-mono ml-4">{formatCurrency(entry.hours * rate, currency)}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {unbilledExpenses.length > 0 && (
                     <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Billable Expenses</h3>
                         <div className="border dark:border-slate-700 rounded-md p-2 space-y-1">
                            {unbilledExpenses.map(expense => {
                                const checkId = `exp-check-${expense.id}`;
                                return (
                                     <div key={`exp-${expense.id}`} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                                        <div className="flex items-center flex-grow">
                                            <input
                                                id={checkId}
                                                type="checkbox"
                                                checked={selectedItems.some(i => i.id === expense.id && i.type === 'expense')}
                                                onChange={() => handleSelectItem(expense, 'expense')}
                                                className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500 mr-3"
                                            />
                                            <label htmlFor={checkId} className="flex-grow cursor-pointer">
                                                <p>{expense.description} on {expense.date}</p>
                                            </label>
                                        </div>
                                        <p className="font-mono ml-4">{formatCurrency(expense.amount, currency)}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
                 {(unbilledEntries.length === 0 && unbilledExpenses.length === 0) && (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-8">No unbilled items found for this client and currency.</p>
                )}
            </div>
            <div className="flex justify-between items-center mt-6">
                <div>
                     <span className="text-lg font-semibold">Total: </span>
                     <span className="text-lg font-bold font-mono">{formatCurrency(totalSelectedAmount, currency)}</span>
                </div>
                <div className="flex gap-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleCreateInvoice} disabled={selectedItems.length === 0}>
                        Create Invoice for {formatCurrency(totalSelectedAmount, currency)}
                    </Button>
                </div>
            </div>
        </Dialog>
    );
};

const Toast = ({ message, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white py-3 px-5 rounded-lg shadow-lg animate-toast-in">
            {message}
        </div>
    );
};


// --- VIEW COMPONENTS ---

const TaxEstimator = ({ invoices, taxSettings, currencySettings }) => {
    const getQuarterDetails = (date) => {
        const month = date.getMonth();
        const year = date.getFullYear();
        if (month < 3) return { quarter: 1, start: new Date(year, 0, 1), end: new Date(year, 2, 31) };
        if (month < 6) return { quarter: 2, start: new Date(year, 3, 1), end: new Date(year, 5, 30) };
        if (month < 9) return { quarter: 3, start: new Date(year, 6, 1), end: new Date(year, 8, 30) };
        return { quarter: 4, start: new Date(year, 9, 1), end: new Date(year, 11, 31) };
    };

    const today = new Date();
    const { quarter, start, end } = getQuarterDetails(today);

    const quarterlyRevenue = invoices
        .filter(inv => {
            const issueDate = new Date(inv.issueDate);
            return inv.status === 'Paid' && issueDate >= start && issueDate <= end && inv.currency === currencySettings.default;
        })
        .reduce((sum, inv) => sum + inv.amount, 0);

    const estimatedTax = quarterlyRevenue * (taxSettings.rate / 100);

    return (
        <Card>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Quarterly Tax Estimate</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Q{quarter} {today.getFullYear()} (in your default currency: {currencySettings.default})</p>
            <div className="mt-4">
                <div className="flex justify-between items-baseline">
                    <span className="text-slate-600 dark:text-slate-300">Revenue this Quarter:</span>
                    <span className="font-semibold text-slate-800 dark:text-white">{formatCurrency(quarterlyRevenue, currencySettings.default)}</span>
                </div>
                <div className="flex justify-between items-baseline mt-2">
                    <span className="text-slate-600 dark:text-slate-300">Estimated Tax Rate:</span>
                    <span className="font-semibold text-slate-800 dark:text-white">{taxSettings.rate}%</span>
                </div>
                <div className="border-t dark:border-slate-800 my-3"></div>
                <div className="flex justify-between items-baseline">
                    <span className="font-bold text-slate-800 dark:text-white">Estimated Tax Owed:</span>
                    <span className="font-bold text-2xl text-slate-900 dark:text-slate-200">{formatCurrency(estimatedTax, currencySettings.default)}</span>
                </div>
            </div>
             <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 text-center">
                This is a simple estimate based on paid invoices and is not professional tax advice.
            </p>
        </Card>
    );
};

const DashboardView = ({ projects, clients, timeEntries, invoices, taxSettings, currencySettings }) => {
    const projectsWithData = projects.filter(p => p);
    const totalProjects = projectsWithData.length;
    const totalClients = clients.length;
    const activeProjects = projectsWithData.filter(p => p.status === 'In Progress').length;
    const totalHoursTracked = projectsWithData.reduce((acc, p) => acc + p.tracked, 0);
    const projectMap = projectsWithData.reduce((acc, proj) => {
        acc[proj.id] = proj.name;
        return acc;
    }, {});

    const recentActivities = [
        ...timeEntries.slice(0, 3).map(t => ({ type: 'time', data: t, date: t.date })),
        ...invoices.slice(0, 2).map(i => ({ type: 'invoice', data: i, date: i.issueDate }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));


    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">Welcome back! Here's a summary of your activity.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <Card>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Projects</h3>
                    <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">{totalProjects}</p>
                </Card>
                <Card>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Projects</h3>
                    <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">{activeProjects}</p>
                </Card>
                 <Card>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Clients</h3>
                    <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">{totalClients}</p>
                </Card>
                <Card>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Hours Tracked</h3>
                    <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">{totalHoursTracked.toFixed(1)}</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                 <Card>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Recent Activity</h3>
                    <ul className="divide-y dark:divide-slate-800">
                        {recentActivities.slice(0, 5).map((activity, index) => (
                            <li key={index} className="py-3 flex justify-between items-center">
                                {activity.type === 'time' && (
                                    <>
                                        <div>
                                            <p className="font-medium text-slate-800 dark:text-slate-100">Logged {activity.data.hours.toFixed(1)} hours on <span className="font-semibold">{projectMap[activity.data.projectId]}</span></p>
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
                <TaxEstimator invoices={invoices} taxSettings={taxSettings} currencySettings={currencySettings} />
            </div>
        </div>
    );
};

const ClientsView = ({ clients, setClients, projects, setProjects, showToast, clientProjectCounts }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [clientToDelete, setClientToDelete] = useState(null);

    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');

    const openAddDialog = () => {
        setEditingClient(null);
        setFormName('');
        setFormEmail('');
        setIsDialogOpen(true);
    };

    const openEditDialog = (client) => {
        setEditingClient(client);
        setFormName(client.name);
        setFormEmail(client.email);
        setIsDialogOpen(true);
    };
    
    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingClient(null);
    };

    const handleSaveClient = (e) => {
        e.preventDefault();
        if (formName.trim() && formEmail.trim()) {
            if (editingClient) {
                // Update existing client
                const oldName = editingClient.name;
                setClients(clients.map(c => c.id === editingClient.id ? { ...c, name: formName, email: formEmail } : c));
                setProjects(projects.map(p => p.client === oldName ? { ...p, client: formName } : p));
                showToast("Client updated successfully!");
            } else {
                // Add new client
                const newClient = {
                    id: clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1,
                    name: formName,
                    email: formEmail
                };
                setClients([newClient, ...clients]);
                showToast("Client added successfully!");
            }
            closeDialog();
        }
    };
    
    const handleDeleteClient = () => {
        if (clientToDelete) {
            setClients(clients.filter(c => c.id !== clientToDelete.id));
            setProjects(projects.map(p => p.client === clientToDelete.name ? { ...p, client: 'No Client' } : p));
            setClientToDelete(null);
            showToast("Client deleted.");
        }
    };


    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Clients</h1>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">Manage your clients here.</p>
                </div>
                <Button onClick={openAddDialog}>Add New Client</Button>
            </div>
            
            <Card className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b dark:border-slate-800">
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Name</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Email</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Projects</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                        {clients.map(client => (
                            <tr key={client.id}>
                                <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{client.name}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{client.email}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-400 text-center">{clientProjectCounts[client.name] || 0}</td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" className="px-2" onClick={() => openEditDialog(client)}>
                                            <EditIcon className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" className="px-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50" onClick={() => setClientToDelete(client)}>
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            <Dialog isOpen={isDialogOpen} onClose={closeDialog} title={editingClient ? "Edit Client" : "Add New Client"}>
                <form onSubmit={handleSaveClient} className="space-y-4">
                    <div>
                        <Label htmlFor="clientName">Client Name</Label>
                        <Input id="clientName" type="text" value={formName} onChange={(e) => setFormName(e.target.value)} required />
                    </div>
                    <div>
                        <Label htmlFor="clientEmail">Client Email</Label>
                        <Input id="clientEmail" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={closeDialog}>Cancel</Button>
                        <Button type="submit">{editingClient ? "Save Changes" : "Add Client"}</Button>
                    </div>
                </form>
            </Dialog>

            <Dialog isOpen={!!clientToDelete} onClose={() => setClientToDelete(null)} title="Delete Client">
                <p>Are you sure you want to delete the client "{clientToDelete?.name}"? This action cannot be undone.</p>
                <div className="flex justify-end gap-4 mt-6">
                    <Button variant="secondary" onClick={() => setClientToDelete(null)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteClient}>Delete</Button>
                </div>
            </Dialog>
        </div>
    );
};
const ProjectsView = ({ projects, setProjects, clients, currencySettings, showToast }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [projectToDelete, setProjectToDelete] = useState(null);
    
    const [formState, setFormState] = useState({
        name: '',
        client: clients.length > 0 ? clients[0].name : '',
        status: 'Planning',
        billingType: 'Hourly',
        billingRate: 100,
        budget: 5000,
        currency: currencySettings.default,
    });
    
    const openAddDialog = () => {
        setEditingProject(null);
        setFormState({
            name: '',
            client: clients.length > 0 ? clients[0].name : '',
            status: 'Planning',
            billingType: 'Hourly',
            billingRate: 100,
            budget: 5000,
            currency: currencySettings.default,
        });
        setIsDialogOpen(true);
    };

    const openEditDialog = (project) => {
        setEditingProject(project);
        setFormState({
            name: project.name,
            client: project.client,
            status: project.status,
            billingType: project.billing.type,
            billingRate: project.billing.rate || 100,
            budget: project.budget || 5000,
            currency: project.currency,
        });
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingProject(null);
    };
    
    const handleFormChange = (e) => {
        const { id, value } = e.target;
        setFormState(prev => ({...prev, [id]: value}));
    };

    const handleSaveProject = (e) => {
        e.preventDefault();
        if (formState.name.trim() && formState.client) {
            const projectData = {
                name: formState.name,
                client: formState.client,
                status: formState.status,
                currency: formState.currency,
                billing: {
                    type: formState.billingType,
                    rate: formState.billingType === 'Hourly' ? parseFloat(formState.billingRate) : undefined,
                },
                budget: formState.billingType === 'Fixed Price' ? parseFloat(formState.budget) : null,
            };

            if (editingProject) {
                setProjects(projects.map(p => p.id === editingProject.id ? { ...p, ...projectData } : p));
                showToast("Project updated successfully!");
            } else {
                 const newProject = {
                    id: projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1,
                    ...projectData,
                    tracked: 0,
                };
                setProjects([newProject, ...projects]);
                showToast("Project created successfully!");
            }
            closeDialog();
        }
    };
    
    const handleDeleteProject = () => {
        if (projectToDelete) {
            setProjects(projects.filter(p => p.id !== projectToDelete.id));
            setProjectToDelete(null);
            showToast("Project deleted.");
        }
    };
    
    const statusOptions = ["Planning", "In Progress", "Completed", "On Hold"];
    
    const statusColors = {
        "In Progress": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        "Completed": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        "Planning": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        "On Hold": "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Projects</h1>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">Manage your projects here.</p>
                </div>
                <Button onClick={openAddDialog}>Create New Project</Button>
            </div>
            
            <Card className="overflow-x-auto">
                <table className="w-full text-left">
                     <thead>
                        <tr className="border-b dark:border-slate-800">
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Project Name</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Client</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Hours Tracked</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                        {projects.map(project => (
                             <tr key={project.id}>
                                <td className="p-4 font-medium text-slate-900 dark:text-slate-300">
                                    {project.name}
                                </td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{project.client}</td>
                                <td className="p-4">
                                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[project.status]}`}>
                                        {project.status}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-800 dark:text-slate-100 text-right font-mono">{project.tracked.toFixed(2)}</td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" className="px-2" onClick={() => openEditDialog(project)}>
                                            <EditIcon className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" className="px-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50" onClick={() => setProjectToDelete(project)}>
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            <Dialog isOpen={isDialogOpen} onClose={closeDialog} title={editingProject ? "Edit Project" : "Create New Project"}>
                <form onSubmit={handleSaveProject} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Project Name</Label>
                        <Input id="name" type="text" value={formState.name} onChange={handleFormChange} required />
                    </div>
                    <div>
                       <Label htmlFor="client">Client</Label>
                       <Select id="client" value={formState.client} onChange={handleFormChange}>
                           {clients.map(client => (
                               <option key={client.id} value={client.name}>{client.name}</option>
                           ))}
                       </Select>
                   </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div>
                            <Label htmlFor="billingType">Billing Method</Label>
                            <Select id="billingType" value={formState.billingType} onChange={handleFormChange}>
                               <option>Hourly</option>
                               <option>Fixed Price</option>
                            </Select>
                         </div>
                         {formState.billingType === 'Hourly' ? (
                             <div>
                                <Label htmlFor="billingRate">Hourly Rate</Label>
                                <div className="relative">
                                     <Input id="billingRate" type="number" value={formState.billingRate} onChange={handleFormChange} className="pl-8"/>
                                     <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">{CURRENCIES.find(c=>c.code === formState.currency)?.symbol || '$'}</span>
                                </div>
                             </div>
                         ) : (
                             <div>
                                <Label htmlFor="budget">Project Budget</Label>
                                 <div className="relative">
                                    <Input id="budget" type="number" value={formState.budget} onChange={handleFormChange} className="pl-8"/>
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">{CURRENCIES.find(c=>c.code === formState.currency)?.symbol || '$'}</span>
                                 </div>
                             </div>
                         )}
                     </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div>
                            <Label htmlFor="currency">Currency</Label>
                            <Select id="currency" value={formState.currency} onChange={handleFormChange}>
                               {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                            </Select>
                         </div>
                         <div>
                            <Label htmlFor="status">Status</Label>
                            <Select id="status" value={formState.status} onChange={handleFormChange}>
                                {statusOptions.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={closeDialog}>Cancel</Button>
                        <Button type="submit">{editingProject ? "Save Changes" : "Create Project"}</Button>
                    </div>
                </form>
            </Dialog>

            <Dialog isOpen={!!projectToDelete} onClose={() => setProjectToDelete(null)} title="Delete Project">
                <p>Are you sure you want to delete the project "{projectToDelete?.name}"? This will not delete its associated time entries but may affect reporting.</p>
                 <div className="flex justify-end gap-4 mt-6">
                    <Button variant="secondary" onClick={() => setProjectToDelete(null)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteProject}>Delete</Button>
                </div>
            </Dialog>
        </div>
    );
};

const TimeTrackingView = ({
    projects, setProjects, timeEntries, setTimeEntries, showToast,
    isTimerRunning, setIsTimerRunning, timerStartTime, setTimerStartTime,
    elapsedTime, setElapsedTime, timerProjectId, setTimerProjectId
}) => {
    const [selectedProject, setSelectedProject] = useState(projects.length > 0 ? projects[0].id : '');
    const [hours, setHours] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [entryToDelete, setEntryToDelete] = useState(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [editFormState, setEditFormState] = useState({
        projectId: '',
        hours: '',
        date: '',
        description: '',
    });

    const openEditDialog = (entry) => {
        setEditingEntry(entry);
        setEditFormState({
            projectId: entry.projectId,
            hours: entry.hours,
            date: entry.date,
            description: entry.description,
        });
        setIsEditDialogOpen(true);
    };

    const closeEditDialog = () => {
        setEditingEntry(null);
        setIsEditDialogOpen(false);
    };

    const handleUpdateEntry = (e) => {
        e.preventDefault();
        if (!editingEntry) return;

        const originalEntry = timeEntries.find(t => t.id === editingEntry.id);
        const originalHours = originalEntry.hours;
        const newHours = parseFloat(editFormState.hours);

        const updatedEntry = {
            ...editingEntry,
            ...editFormState,
            hours: newHours,
            projectId: parseInt(editFormState.projectId),
        };

        setTimeEntries(timeEntries.map(t => t.id === editingEntry.id ? updatedEntry : t));

        // Adjust project tracked hours
        const hoursDifference = newHours - originalHours;

        if (originalEntry.projectId === updatedEntry.projectId) {
            // Project is the same, just update hours
            setProjects(projects.map(p =>
                p.id === updatedEntry.projectId
                ? { ...p, tracked: p.tracked + hoursDifference }
                : p
            ));
        } else {
            // Project has changed
            setProjects(projects.map(p => {
                if (p.id === originalEntry.projectId) {
                    return { ...p, tracked: p.tracked - originalHours };
                }
                if (p.id === updatedEntry.projectId) {
                    return { ...p, tracked: p.tracked + newHours };
                }
                return p;
            }));
        }

        showToast("Time entry updated successfully!");
        closeEditDialog();
    };

    const handleDeleteEntry = () => {
        if (!entryToDelete) return;

        const hoursToSubtract = entryToDelete.hours;

        // Subtract hours from the associated project
        setProjects(projects.map(p =>
            p.id === entryToDelete.projectId
            ? { ...p, tracked: p.tracked - hoursToSubtract }
            : p
        ));

        // Remove the time entry
        setTimeEntries(timeEntries.filter(t => t.id !== entryToDelete.id));

        showToast("Time entry deleted.");
        setEntryToDelete(null);
    };

    const handleStartTimer = () => {
        if (!timerProjectId) {
            showToast("Please select a project to track.");
            return;
        }
        setIsTimerRunning(true);
        setTimerStartTime(Date.now());
        setElapsedTime(0);
    };

    const handleStopTimer = () => {
        setIsTimerRunning(false);
        const finalElapsedTimeInHours = (elapsedTime / 3600).toFixed(2);
        
        setSelectedProject(timerProjectId);
        setHours(finalElapsedTimeInHours);
        setDate(new Date().toISOString().split('T')[0]);
        setDescription(`Real-time tracked entry for ${new Date().toLocaleTimeString()}`);
        
        setTimerStartTime(null);
        setElapsedTime(0);
        showToast(`Timer stopped at ${formatTime(elapsedTime)}.`);
    };

    const handleAddTimeEntry = (e) => {
        e.preventDefault();
        const hoursNum = parseFloat(hours);
        if (!selectedProject || !hours || isNaN(hoursNum) || hoursNum <= 0) {
            showToast("Invalid time entry.");
            return;
        }
        const newEntry = {
            id: timeEntries.length > 0 ? Math.max(...timeEntries.map(t => t.id)) + 1 : 1,
            projectId: parseInt(selectedProject),
            hours: hoursNum,
            date,
            description,
            isBilled: false,
        };
        setTimeEntries([newEntry, ...timeEntries]);
        
        setProjects(projects.map(p => p.id === parseInt(selectedProject) ? { ...p, tracked: p.tracked + hoursNum } : p));
        
        setHours('');
        setDescription('');
        showToast("Time entry logged successfully!");
    };
    
    const projectMap = projects.reduce((acc, proj) => {
        acc[proj.id] = proj.name;
        return acc;
    }, {});

    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };
    
    const timerProjectName = timerProjectId ? projectMap[timerProjectId] : 'No project selected';

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Time Tracking</h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">Log your work hours or use the real-time tracker.</p>

            <Card className="my-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="flex-1 min-w-[200px]">
                         <Label htmlFor="timerProject">Track Project</Label>
                         <Select id="timerProject" value={timerProjectId || ''} onChange={(e) => setTimerProjectId(e.target.value)} disabled={isTimerRunning}>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </Select>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{isTimerRunning ? `Tracking: ${timerProjectName}` : 'Timer is stopped'}</p>
                        <p className="text-4xl font-bold font-mono text-slate-800 dark:text-white">{formatTime(elapsedTime)}</p>
                    </div>
                    <div>
                        {isTimerRunning ? (
                            <Button variant="destructive" onClick={handleStopTimer} className="w-32">Stop Timer</Button>
                        ) : (
                            <Button onClick={handleStartTimer} className="w-32">Start Timer</Button>
                        )}
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Log Time Manually</h3>
                        <form onSubmit={handleAddTimeEntry} className="space-y-4">
                             <div>
                                <Label htmlFor="logProject">Project</Label>
                                <Select id="logProject" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="hours">Hours</Label>
                                <Input id="hours" type="number" step="0.01" value={hours} onChange={e => setHours(e.target.value)} required />
                            </div>
                             <div>
                                <Label htmlFor="date">Date</Label>
                                <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                            </div>
                             <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} />
                            </div>
                            <Button type="submit" className="w-full">Log Time</Button>
                        </form>
                    </Card>
                </div>
                 <div className="lg:col-span-2">
                     <Card className="overflow-x-auto">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Recent Entries</h3>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b dark:border-slate-800">
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Project</th>
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Hours</th>
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Date</th>
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-slate-800">
                                {timeEntries.map(entry => (
                                    <tr key={entry.id} title={entry.description}>
                                        <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{projectMap[entry.projectId]}</td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400 text-right font-mono">{entry.hours.toFixed(2)}</td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400">{entry.date}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" className="px-2" onClick={() => openEditDialog(entry)}>
                                                    <EditIcon className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" className="px-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50" onClick={() => setEntryToDelete(entry)}>
                                                    <TrashIcon className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </div>
            </div>

            <Dialog isOpen={isEditDialogOpen} onClose={closeEditDialog} title="Edit Time Entry">
                <form onSubmit={handleUpdateEntry} className="space-y-4">
                    <div>
                        <Label htmlFor="editProject">Project</Label>
                        <Select id="editProject" value={editFormState.projectId} onChange={e => setEditFormState({...editFormState, projectId: e.target.value})}>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="editHours">Hours</Label>
                        <Input id="editHours" type="number" step="0.01" value={editFormState.hours} onChange={e => setEditFormState({...editFormState, hours: e.target.value})} required />
                    </div>
                    <div>
                        <Label htmlFor="editDate">Date</Label>
                        <Input id="editDate" type="date" value={editFormState.date} onChange={e => setEditFormState({...editFormState, date: e.target.value})} required />
                    </div>
                    <div>
                        <Label htmlFor="editDescription">Description</Label>
                        <Textarea id="editDescription" value={editFormState.description} onChange={e => setEditFormState({...editFormState, description: e.target.value})} />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={closeEditDialog}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </Dialog>

            <Dialog isOpen={!!entryToDelete} onClose={() => setEntryToDelete(null)} title="Delete Time Entry">
                <p>Are you sure you want to delete this time entry? This action cannot be undone.</p>
                <div className="flex justify-end gap-4 mt-6">
                    <Button variant="secondary" onClick={() => setEntryToDelete(null)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteEntry}>Delete</Button>
                </div>
            </Dialog>
        </div>
    );
};

const InvoiceDetailView = ({ invoice, client, onBack, onStatusChange, onDownloadPdf, userProfile, onDelete }) => {
    const statusColors = {
        "Paid": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        "Draft": "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
        "Overdue": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <div>
                    <Button variant="secondary" onClick={onBack}>&larr; Back to Invoices</Button>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white mt-4">Invoice {invoice.id}</h1>
                    <span className={`mt-1 px-2 py-1 text-sm font-semibold rounded-full ${statusColors[invoice.status]}`}>
                        {invoice.status}
                    </span>
                </div>
                <div className="flex gap-2">
                    {invoice.status === 'Draft' && (
                        <Button onClick={() => onStatusChange(invoice.id, 'Paid')}>Mark as Paid</Button>
                    )}
                    <Button variant="secondary" onClick={onDownloadPdf}>
                        Download PDF
                    </Button>
                    <Button variant="destructive" onClick={() => onDelete(invoice.id)}>
                        <TrashIcon className="w-4 h-4 mr-2" />
                        Delete Invoice
                    </Button>
                </div>
            </div>

            <Card id="invoice-content">
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        {userProfile.logo ? (
                            <img src={userProfile.logo} alt="Company Logo" className="h-12 max-w-[200px] object-contain mb-4" />
                        ) : (
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-200">{userProfile.companyName}</h2>
                        )}
                        <p className="text-slate-500 dark:text-slate-400">{userProfile.companyEmail}</p>
                        <p className="text-slate-500 dark:text-slate-400">{userProfile.companyAddress}</p>
                    </div>
                    <div className="text-right">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Bill To:</h3>
                        <p className="font-bold">{client?.name}</p>
                        <p className="text-slate-500 dark:text-slate-400">{client?.email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-8 mt-8">
                    <div>
                        <h3 className="text-sm text-slate-500 dark:text-slate-400">Invoice Number</h3>
                        <p className="font-medium text-slate-800 dark:text-white">{invoice.id}</p>
                    </div>
                    <div>
                        <h3 className="text-sm text-slate-500 dark:text-slate-400">Issue Date</h3>
                        <p className="font-medium text-slate-800 dark:text-white">{invoice.issueDate}</p>
                    </div>
                    <div>
                        <h3 className="text-sm text-slate-500 dark:text-slate-400">Due Date</h3>
                        <p className="font-medium text-slate-800 dark:text-white">{invoice.dueDate}</p>
                    </div>
                </div>

                <div className="mt-8 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                            <tr className="border-b dark:border-slate-700">
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Description</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Hours/Qty</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Rate/Price</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-slate-800">
                            {(invoice.items || []).map((item, index) => (
                                <tr key={index}>
                                    <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{item.description}</td>
                                    {item.hours ? ( // Time Entry
                                        <>
                                            <td className="p-4 text-slate-600 dark:text-slate-400 text-right font-mono">{item.hours.toFixed(2)}</td>
                                            <td className="p-4 text-slate-600 dark:text-slate-400 text-right font-mono">{formatCurrency(item.rate, invoice.currency)}</td>
                                            <td className="p-4 text-slate-800 dark:text-slate-100 text-right font-mono">{formatCurrency(item.hours * item.rate, invoice.currency)}</td>
                                        </>
                                    ) : ( // Expense
                                        <>
                                            <td className="p-4 text-slate-600 dark:text-slate-400 text-right font-mono">1</td>
                                            <td className="p-4 text-slate-600 dark:text-slate-400 text-right font-mono">{formatCurrency(item.amount, invoice.currency)}</td>
                                            <td className="p-4 text-slate-800 dark:text-slate-100 text-right font-mono">{formatCurrency(item.amount, invoice.currency)}</td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t-2 border-slate-200 dark:border-slate-700">
                             <tr>
                                <td colSpan="3" className="p-4 text-right font-semibold text-slate-800 dark:text-white">Total</td>
                                <td className="p-4 text-right font-bold text-xl text-slate-900 dark:text-white">{formatCurrency(invoice.amount, invoice.currency)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </Card>
        </div>
    );
};

const invoiceTranslations = {
    en: {
        invoice: 'INVOICE', billTo: 'Bill To:', issueDate: 'Issue Date:', dueDate: 'Due Date:',
        description: 'Description', quantity: 'Quantity', rate: 'Rate', amount: 'Amount',
        subtotal: 'Subtotal:', tax: 'Tax', total: 'Total:', thankYou: 'Thank you for your business!',
    },
    de: {
        invoice: 'RECHNUNG', billTo: 'Rechnung an:', issueDate: 'Rechnungsdatum:', dueDate: 'Fällig am:',
        description: 'Beschreibung', quantity: 'Menge', rate: 'Satz', amount: 'Betrag',
        subtotal: 'Zwischensumme:', tax: 'MwSt.', total: 'Gesamt:', thankYou: 'Vielen Dank für Ihren Auftrag!',
    }
};

const InvoicesView = ({ projects, clients, timeEntries, setTimeEntries, invoices, setInvoices, expenses, setExpenses, userProfile, recurringInvoices, setRecurringInvoices, showToast, currencySettings, taxSettings }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(clients.length > 0 ? clients[0].id : '');
    const [selectedCurrency, setSelectedCurrency] = useState('USD');
    const [viewingInvoice, setViewingInvoice] = useState(null);
    const [activeTab, setActiveTab] = useState('one-time');
    const [isBillableModalOpen, setIsBillableModalOpen] = useState(false);
    const [itemsToBill, setItemsToBill] = useState({ entries: [], expenses: [] });
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);

    const projectMap = useMemo(() => projects.reduce((acc, proj) => {
        acc[proj.id] = proj;
        return acc;
    }, {}), [projects]);

    const handleCreateInvoiceFromSelectedItems = (selectedEntries, selectedExpenses) => {
        if (!selectedClient) return;

        const clientObj = clients.find(c => c.id === parseInt(selectedClient));
        if (!clientObj) return;

        if (selectedEntries.length === 0 && selectedExpenses.length === 0) {
            showToast(`No items selected to invoice.`);
            return;
        }

        const timeInvoiceItems = selectedEntries.map(entry => {
            const project = projectMap[entry.projectId];
            const rate = entry.rate; // Use the rate from the entry
            return {
                id: `time-${entry.id}`,
                description: `${project?.name || 'Project'} - ${entry.description || 'Work done'} on ${entry.date}`,
                hours: entry.hours,
                rate: rate
            }
        });

        const expenseInvoiceItems = selectedExpenses.map(expense => ({
            id: `exp-${expense.id}`,
            description: `Expense: ${expense.description} on ${expense.date}`,
            amount: expense.amount,
        }));

        const timeAmount = timeInvoiceItems.reduce((sum, item) => sum + (item.hours * item.rate), 0);
        const expensesAmount = selectedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalAmount = timeAmount + expensesAmount;

        const newInvoice = {
            id: `INV-${String(invoices.length + 1).padStart(3, '0')}`,
            clientName: clientObj.name,
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: totalAmount,
            status: 'Draft',
            currency: selectedCurrency,
            items: [...timeInvoiceItems, ...expenseInvoiceItems],
        };

        setInvoices([newInvoice, ...invoices]);

        const billedEntryIds = selectedEntries.map(entry => entry.id);
        const updatedTimeEntries = timeEntries.map(entry =>
            billedEntryIds.includes(entry.id) ? { ...entry, isBilled: true } : entry
        );
        setTimeEntries(updatedTimeEntries);

        const billedExpenseIds = selectedExpenses.map(exp => exp.id);
        const updatedExpenses = expenses.map(exp =>
            billedExpenseIds.includes(exp.id) ? { ...exp, isBilled: true } : exp
        );
        setExpenses(updatedExpenses);

        showToast(`Invoice ${newInvoice.id} created!`);
        setIsBillableModalOpen(false);
    };

    const handleOpenBillableModal = () => {
        if (!selectedClient) return;

        const clientObj = clients.find(c => c.id === parseInt(selectedClient));
        if (!clientObj) return;

        const clientProjects = projects.filter(p => p.client === clientObj.name && p.currency === selectedCurrency);
        const clientProjectIds = clientProjects.map(p => p.id);

        const unbilledEntries = timeEntries.filter(entry =>
            clientProjectIds.includes(entry.projectId) && !entry.isBilled
        );

        const unbilledExpenses = expenses.filter(expense =>
            clientProjectIds.includes(expense.projectId) && !expense.isBilled && expense.isBillable
        );

        const unbilledEntriesWithRate = unbilledEntries.map(entry => {
            const project = projectMap[entry.projectId];
            const rate = project?.billing?.type === 'Hourly' ? project.billing.rate : 0;
            return {...entry, rate };
        });

        setItemsToBill({ entries: unbilledEntriesWithRate, expenses: unbilledExpenses });
        setIsBillableModalOpen(true);
        setIsDialogOpen(false);
    };

    const handleStatusChange = (invoiceId, newStatus) => {
        setInvoices(invoices.map(inv => inv.id === invoiceId ? {...inv, status: newStatus} : inv));
        setViewingInvoice(prev => prev ? {...prev, status: newStatus} : null);
        showToast(`Invoice ${invoiceId} marked as ${newStatus}.`);
    };

    const handleDeleteInvoice = () => {
        if (!invoiceToDelete) return;

        const { items } = invoiceToDelete;
        const timeEntryIdsToUnbill = items.filter(item => item.id.startsWith('time-')).map(item => parseInt(item.id.split('-')[1]));
        const expenseIdsToUnbill = items.filter(item => item.id.startsWith('exp-')).map(item => parseInt(item.id.split('-')[1]));

        setTimeEntries(timeEntries.map(entry =>
            timeEntryIdsToUnbill.includes(entry.id)
                ? { ...entry, isBilled: false }
                : entry
        ));

        setExpenses(expenses.map(expense =>
            expenseIdsToUnbill.includes(expense.id)
                ? { ...expense, isBilled: false }
                : expense
        ));

        setInvoices(invoices.filter(inv => inv.id !== invoiceToDelete.id));
        showToast(`Invoice ${invoiceToDelete.id} deleted.`);
        setInvoiceToDelete(null);
        setViewingInvoice(null);
    };

    const generatePdf = (invoice, client, userProfile, taxSettings) => {
        const doc = new jsPDF();
        // Use the language from the settings prop
        const lang = currencySettings.invoiceLanguage || 'en';
        const t = invoiceTranslations[lang];
        const locale = lang === 'de' ? 'de-DE' : 'en-US';

        const formatLocalizedCurrency = (amount, currency) => {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currency
            }).format(amount);
        };

        const taxRate = taxSettings.rate / 100;
        const subtotal = invoice.amount;
        const taxAmount = subtotal * taxRate;
        const totalAmount = subtotal + taxAmount;

        // Add header
        if (userProfile.logo) {
            doc.addImage(userProfile.logo, 'PNG', 14, 10, 40, 20);
        }
        doc.setFontSize(20);
        doc.text(userProfile.companyName, 14, 40);
        doc.setFontSize(12);
        doc.text(userProfile.companyAddress, 14, 48);
        doc.text(userProfile.companyEmail, 14, 56);

        doc.setFontSize(26);
        doc.text(t.invoice, 200, 20, { align: 'right' });
        doc.setFontSize(12);
        doc.text(`Invoice #: ${invoice.id}`, 200, 30, { align: 'right' });
        doc.text(`${t.issueDate}: ${invoice.issueDate}`, 200, 38, { align: 'right' });
        doc.text(`${t.dueDate}: ${invoice.dueDate}`, 200, 46, { align: 'right' });


        // Add client info
        doc.setFontSize(14);
        doc.text(t.billTo, 14, 70);
        doc.setFontSize(12);
        doc.text(client.name, 14, 78);
        doc.text(client.email, 14, 86);

        // Add table
        const tableColumn = [t.description, t.quantity, t.rate, t.amount];
        const tableRows = [];

        invoice.items.forEach(item => {
            const itemData = [
                item.description,
                item.hours ? item.hours.toFixed(2) : '1',
                item.hours ? formatLocalizedCurrency(item.rate, invoice.currency) : formatLocalizedCurrency(item.amount, invoice.currency),
                item.hours ? formatLocalizedCurrency(item.hours * item.rate, invoice.currency) : formatLocalizedCurrency(item.amount, invoice.currency),
            ];
            tableRows.push(itemData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 100,
        });

        // Add total
        let finalY = doc.lastAutoTable.finalY;
        doc.setFontSize(12);
        doc.text(`${t.subtotal}`, 150, finalY + 10, { align: 'right' });
        doc.text(formatLocalizedCurrency(subtotal, invoice.currency), 200, finalY + 10, { align: 'right' });

        doc.text(`${t.tax} (${taxSettings.rate}%):`, 150, finalY + 18, { align: 'right' });
        doc.text(formatLocalizedCurrency(taxAmount, invoice.currency), 200, finalY + 18, { align: 'right' });

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`${t.total}`, 150, finalY + 26, { align: 'right' });
        doc.text(formatLocalizedCurrency(totalAmount, invoice.currency), 200, finalY + 26, { align: 'right' });


        // Add footer
        doc.setFontSize(10);
        doc.text(t.thankYou, 14, doc.internal.pageSize.height - 10);

        doc.save(`invoice-${invoice.id}.pdf`);
        showToast("PDF generated successfully!");
    };

    const handleDownloadPdf = () => {
        const client = clients.find(c => c.name === viewingInvoice.clientName);
        generatePdf(viewingInvoice, client, userProfile, taxSettings);
    };
    
    const statusColors = {
        "Paid": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        "Draft": "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
        "Overdue": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };

    return (
        <div>
            {viewingInvoice ? (
                <InvoiceDetailView 
                    invoice={viewingInvoice} 
                    client={clients.find(c => c.name === viewingInvoice.clientName)}
                    onBack={() => setViewingInvoice(null)}
                    onStatusChange={handleStatusChange}
                    onDelete={() => setInvoiceToDelete(viewingInvoice)}
                    onDownloadPdf={handleDownloadPdf}
                    userProfile={userProfile}
                />
            ) : (
                <>
                    <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Invoices</h1>
                            <p className="mt-1 text-slate-600 dark:text-slate-400">Create and manage your client invoices.</p>
                        </div>
                    </div>

                    <div className="border-b dark:border-slate-800 mb-6">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('one-time')}
                                className={`${
                                    activeTab === 'one-time'
                                        ? 'border-slate-900 dark:border-slate-50 text-slate-900 dark:text-slate-50'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                            >
                                One-Time Invoices
                            </button>
                            <button
                                onClick={() => setActiveTab('recurring')}
                                className={`${
                                    activeTab === 'recurring'
                                        ? 'border-slate-900 dark:border-slate-50 text-slate-900 dark:text-slate-50'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                            >
                                Recurring Invoices
                            </button>
                        </nav>
                    </div>
                    
                    {activeTab === 'one-time' && (
                        <>
                        <div className="text-right mb-4">
                            <Button onClick={() => setIsDialogOpen(true)}>Create New Invoice</Button>
                        </div>
                        <Card className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b dark:border-slate-800">
                                        <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Invoice ID</th>
                                        <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Client</th>
                                        <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Issue Date</th>
                                        <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                                        <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-slate-800">
                                    {invoices.map(invoice => (
                                        <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => setViewingInvoice(invoice)}>
                                            <td className="p-4 font-medium text-slate-800 dark:text-slate-100 font-mono">{invoice.id}</td>
                                            <td className="p-4 text-slate-600 dark:text-slate-400">{invoice.clientName}</td>
                                            <td className="p-4 text-slate-600 dark:text-slate-400">{invoice.issueDate}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[invoice.status]}`}>
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-800 dark:text-slate-100 text-right font-mono">{formatCurrency(invoice.amount, invoice.currency)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                        </>
                    )}

                    {activeTab === 'recurring' && (
                        <RecurringInvoicesView clients={clients} recurringInvoices={recurringInvoices} setRecurringInvoices={setRecurringInvoices} showToast={showToast} />
                    )}
                </>
            )}

            <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} title="Create New Invoice">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <Label htmlFor="invoiceClient">Select Client</Label>
                            <Select id="invoiceClient" value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                                 {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="invoiceCurrency">Currency</Label>
                             <Select id="invoiceCurrency" value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)}>
                                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                            </Select>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">This will find all unbilled hours and expenses in the selected currency for this client.</p>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleOpenBillableModal}>Find Billable Items</Button>
                </div>
            </Dialog>

            <BillableItemsModal
                isOpen={isBillableModalOpen}
                onClose={() => setIsBillableModalOpen(false)}
                unbilledEntries={itemsToBill.entries}
                unbilledExpenses={itemsToBill.expenses}
                onCreateInvoice={handleCreateInvoiceFromSelectedItems}
                currency={selectedCurrency}
            />

            <Dialog isOpen={!!invoiceToDelete} onClose={() => setInvoiceToDelete(null)} title="Delete Invoice">
                <p>Are you sure you want to delete invoice "{invoiceToDelete?.id}"? This will mark all associated time and expense entries as unbilled. This action cannot be undone.</p>
                <div className="flex justify-end gap-4 mt-6">
                    <Button variant="secondary" onClick={() => setInvoiceToDelete(null)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteInvoice}>Delete</Button>
                </div>
            </Dialog>
        </div>
    );
};

const RecurringInvoicesView = ({ clients, recurringInvoices, setRecurringInvoices, showToast }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRecurring, setEditingRecurring] = useState(null);
    const [recurringToDelete, setRecurringToDelete] = useState(null);

    const defaultFormState = {
        clientName: clients.length > 0 ? clients[0].name : '',
        frequency: 'Monthly',
        startDate: new Date().toISOString().split('T')[0],
        lineItems: [{ description: '', amount: '' }],
        currency: 'USD',
    };
    
    const [formState, setFormState] = useState(defaultFormState);

    const handleAddItem = () => setFormState(prev => ({...prev, lineItems: [...prev.lineItems, {description: '', amount: ''}]}));
    const handleRemoveItem = (index) => setFormState(prev => ({...prev, lineItems: prev.lineItems.filter((_, i) => i !== index)}));
    const handleItemChange = (index, field, value) => {
        const newItems = [...formState.lineItems];
        newItems[index][field] = value;
        setFormState(prev => ({...prev, lineItems: newItems}));
    };
    
    const handleFormStateChange = (e) => {
        setFormState(prev => ({...prev, [e.target.id]: e.target.value }));
    };
    
    const openAddDialog = () => {
        setEditingRecurring(null);
        setFormState(defaultFormState);
        setIsDialogOpen(true);
    };

    const openEditDialog = (rec) => {
        setEditingRecurring(rec);
        setFormState({
            clientName: rec.clientName,
            frequency: rec.frequency,
            startDate: rec.nextDueDate,
            lineItems: rec.items,
            currency: rec.currency,
        });
        setIsDialogOpen(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        const totalAmount = formState.lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        
        if (editingRecurring) {
            const updatedRecurring = {
                ...editingRecurring,
                clientName: formState.clientName,
                frequency: formState.frequency,
                nextDueDate: formState.startDate,
                amount: totalAmount,
                currency: formState.currency,
                items: formState.lineItems.map(item => ({...item, amount: parseFloat(item.amount) || 0 }))
            };
            setRecurringInvoices(recurringInvoices.map(r => r.id === editingRecurring.id ? updatedRecurring : r));
            showToast("Recurring profile updated!");

        } else {
            const newRecurring = {
                id: recurringInvoices.length > 0 ? Math.max(...recurringInvoices.map(i => i.id)) + 1 : 1,
                clientName: formState.clientName,
                frequency: formState.frequency,
                nextDueDate: formState.startDate,
                amount: totalAmount,
                currency: formState.currency,
                items: formState.lineItems.map(item => ({...item, amount: parseFloat(item.amount) || 0 }))
            };
            setRecurringInvoices([newRecurring, ...recurringInvoices]);
            showToast("Recurring profile created!");
        }
        
        setIsDialogOpen(false);
    };
    
    const handleDelete = () => {
        if (recurringToDelete) {
            setRecurringInvoices(recurringInvoices.filter(r => r.id !== recurringToDelete.id));
            setRecurringToDelete(null);
            showToast("Recurring profile deleted.");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Recurring Profiles</h2>
                 <Button onClick={openAddDialog}>Create Profile</Button>
            </div>
             <Card className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b dark:border-slate-800">
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Client</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Frequency</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Next Due Date</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Amount</th>
                             <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                        {recurringInvoices.map(rec => (
                            <tr key={rec.id}>
                                <td className="p-4 font-medium">{rec.clientName}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{rec.frequency}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{rec.nextDueDate}</td>
                                <td className="p-4 text-right font-mono">{formatCurrency(rec.amount, rec.currency)}</td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" className="px-2" onClick={() => openEditDialog(rec)}>
                                            <EditIcon className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" className="px-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50" onClick={() => setRecurringToDelete(rec)}>
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
             <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} title={editingRecurring ? "Edit Recurring Profile" : "Create Recurring Profile"}>
                <form onSubmit={handleSave} className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <Label htmlFor="clientName">Client</Label>
                           <Select id="clientName" value={formState.clientName} onChange={handleFormStateChange}>
                               {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                           </Select>
                       </div>
                       <div>
                           <Label htmlFor="currency">Currency</Label>
                           <Select id="currency" value={formState.currency} onChange={handleFormStateChange}>
                               {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                           </Select>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="frequency">Frequency</Label>
                            <Select id="frequency" value={formState.frequency} onChange={handleFormStateChange}>
                                <option>Monthly</option>
                                <option>Quarterly</option>
                                <option>Annually</option>
                            </Select>
                        </div>
                         <div>
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input id="startDate" type="date" value={formState.startDate} onChange={handleFormStateChange} />
                        </div>
                    </div>
                    <div>
                        <Label>Line Items</Label>
                        <div className="space-y-2">
                        {formState.lineItems.map((item, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <Input type="text" placeholder="Description" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} className="flex-grow"/>
                                <div className="relative">
                                    <Input type="number" placeholder="Amount" value={item.amount} onChange={e => handleItemChange(index, 'amount', e.target.value)} className="w-28 pl-7"/>
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">{CURRENCIES.find(c => c.code === formState.currency)?.symbol || '$'}</span>
                                </div>
                                <Button type="button" variant="ghost" onClick={() => handleRemoveItem(index)} className="text-red-500"><TrashIcon className="w-4 h-4" /></Button>
                            </div>
                        ))}
                        </div>
                        <Button type="button" variant="secondary" onClick={handleAddItem} className="mt-2 text-sm">Add Item</Button>
                    </div>
                     <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button type="submit">Save Profile</Button>
                    </div>
                </form>
            </Dialog>
            <Dialog isOpen={!!recurringToDelete} onClose={() => setRecurringToDelete(null)} title="Delete Recurring Profile">
                 <p>Are you sure you want to delete this recurring profile for {recurringToDelete?.clientName}?</p>
                <div className="flex justify-end gap-4 mt-6">
                    <Button variant="secondary" onClick={() => setRecurringToDelete(null)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                </div>
            </Dialog>
        </div>
    );
};


const ReportingView = ({ projects, clients, timeEntries, expenses, taxSettings }) => {
    const [filter, setFilter] = useState('all'); // 'week', 'month', 'all'

    const getFilteredEntries = React.useCallback(() => {
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
    const profitabilityData = React.useMemo(() => {
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

const ExpensesView = ({ projects, setExpenses, expenses, showToast }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [expenseToDelete, setExpenseToDelete] = useState(null);

    const [formProjectId, setFormProjectId] = useState(projects.length > 0 ? projects[0].id : '');
    const [formAmount, setFormAmount] = useState('');
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
    const [formDescription, setFormDescription] = useState('');
    const [formIsBillable, setFormIsBillable] = useState(true);

    const projectMap = projects.reduce((acc, proj) => {
        acc[proj.id] = {name: proj.name, currency: proj.currency };
        return acc;
    }, {});
    
    const openAddDialog = () => {
        setEditingExpense(null);
        setFormProjectId(projects.length > 0 ? projects[0].id : '');
        setFormAmount('');
        setFormDate(new Date().toISOString().split('T')[0]);
        setFormDescription('');
        setFormIsBillable(true);
        setIsDialogOpen(true);
    };

    const openEditDialog = (expense) => {
        setEditingExpense(expense);
        setFormProjectId(expense.projectId);
        setFormAmount(expense.amount);
        setFormDate(expense.date);
        setFormDescription(expense.description);
        setFormIsBillable(expense.isBillable);
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingExpense(null);
    };

    const handleSaveExpense = (e) => {
        e.preventDefault();
        const amountNum = parseFloat(formAmount);
        if (formDescription.trim() && formProjectId && !isNaN(amountNum) && amountNum > 0) {
            if (editingExpense) {
                setExpenses(expenses.map(ex => ex.id === editingExpense.id ? { ...ex, projectId: parseInt(formProjectId), amount: amountNum, date: formDate, description: formDescription, isBillable: formIsBillable } : ex));
                showToast("Expense updated!");
            } else {
                const newExpense = {
                    id: expenses.length > 0 ? Math.max(...expenses.map(ex => ex.id)) + 1 : 1,
                    projectId: parseInt(formProjectId),
                    amount: amountNum,
                    date: formDate,
                    description: formDescription,
                    isBilled: false,
                    isBillable: formIsBillable,
                };
                setExpenses([newExpense, ...expenses]);
                showToast("Expense added!");
            }
            closeDialog();
        }
    };

    const handleDeleteExpense = () => {
        if (expenseToDelete) {
            setExpenses(expenses.filter(ex => ex.id !== expenseToDelete.id));
            setExpenseToDelete(null);
            showToast("Expense deleted.");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Expenses</h1>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">Track your project-related expenses.</p>
                </div>
                <Button onClick={openAddDialog}>Add New Expense</Button>
            </div>

            <Card className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b dark:border-slate-800">
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Project</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Description</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Date</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Amount</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                        {expenses.map(expense => (
                            <tr key={expense.id}>
                                <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{projectMap[expense.projectId]?.name || 'N/A'}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{expense.description}</td>
                                 <td className="p-4 text-slate-600 dark:text-slate-400">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        expense.isBillable 
                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                                            : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                                    }`}>
                                        {expense.isBillable ? 'Billable' : 'Internal Cost'}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{expense.date}</td>
                                <td className="p-4 text-slate-800 dark:text-slate-100 text-right font-mono">
                                    {formatCurrency(expense.amount, projectMap[expense.projectId]?.currency || 'USD')}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" className="px-2" onClick={() => openEditDialog(expense)}>
                                            <EditIcon className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" className="px-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50" onClick={() => setExpenseToDelete(expense)}>
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            <Dialog isOpen={isDialogOpen} onClose={closeDialog} title={editingExpense ? "Edit Expense" : "Add New Expense"}>
                <form onSubmit={handleSaveExpense} className="space-y-4">
                    <div>
                        <Label htmlFor="expenseProject">Project</Label>
                        <Select id="expenseProject" value={formProjectId} onChange={(e) => setFormProjectId(e.target.value)}>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.currency})</option>)}
                        </Select>
                    </div>
                     <div>
                        <Label htmlFor="expenseDescription">Description</Label>
                        <Input id="expenseDescription" type="text" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                           <Label htmlFor="expenseAmount">Amount</Label>
                           <Input id="expenseAmount" type="number" step="0.01" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} required />
                        </div>
                        <div>
                           <Label htmlFor="expenseDate">Date</Label>
                           <Input id="expenseDate" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
                        </div>
                    </div>
                     <div className="flex items-center mt-4">
                        <input
                            id="isBillable"
                            type="checkbox"
                            checked={formIsBillable}
                            onChange={(e) => setFormIsBillable(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
                        />
                        <Label htmlFor="isBillable" className="ml-2 mb-0">This expense is billable to the client</Label>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={closeDialog}>Cancel</Button>
                        <Button type="submit">{editingExpense ? "Save Changes" : "Add Expense"}</Button>
                    </div>
                </form>
            </Dialog>

             <Dialog isOpen={!!expenseToDelete} onClose={() => setExpenseToDelete(null)} title="Delete Expense">
                <p>Are you sure you want to delete this expense: "{expenseToDelete?.description}"?</p>
                <div className="flex justify-end gap-4 mt-6">
                    <Button variant="secondary" onClick={() => setExpenseToDelete(null)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteExpense}>Delete</Button>
                </div>
            </Dialog>
        </div>
    );
};

const SettingsView = ({ userProfile, setUserProfile, taxSettings, setTaxSettings, currencySettings, setCurrencySettings, showToast, onImport, onExport }) => {
    const [isEditingCompany, setIsEditingCompany] = useState(false);
    const [companyForm, setCompanyForm] = useState(userProfile);
    const [currentTaxRate, setCurrentTaxRate] = useState(taxSettings.rate);
    const [currentInternalCostRate, setCurrentInternalCostRate] = useState(taxSettings.internalCostRate);
    const [currentDefaultCurrency, setCurrentDefaultCurrency] = useState(currencySettings.default);
    const [currentInvoiceLanguage, setCurrentInvoiceLanguage] = useState(currencySettings.invoiceLanguage || 'en');
    const inputFileRef = React.useRef(null);

    const onImportClick = () => {
        inputFileRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (window.confirm("Are you sure you want to import this data? This will overwrite your current data.")) {
                    onImport(data);
                }
            } catch (error) {
                showToast("Error importing file. Please check the file format.");
                console.error("Import error:", error);
            }
        };
        reader.readAsText(file);
    };

    const handleCompanyInfoChange = (e) => {
        const { id, value } = e.target;
        setCompanyForm(prev => ({ ...prev, [id]: value }));
    };
    
    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCompanyForm(prev => ({...prev, logo: reader.result}));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSaveCompanyInfo = (e) => {
        e.preventDefault();
        setUserProfile(companyForm);
        setIsEditingCompany(false);
        showToast("Company information updated.");
    };
    
    const handleSaveFinancialSettings = (e) => {
        e.preventDefault();
        const rate = parseFloat(currentTaxRate);
        const internalRate = parseFloat(currentInternalCostRate);
        if (!isNaN(rate) && rate >= 0 && rate <= 100 && !isNaN(internalRate) && internalRate >= 0) {
            setTaxSettings({ rate, internalCostRate: internalRate });
            showToast("Financial settings saved.");
        } else {
           showToast("Please enter valid numbers for rates.");
        }
    };
    
    const handleSaveCurrencySettings = (e) => {
        e.preventDefault();
        setCurrencySettings({
            default: currentDefaultCurrency,
            invoiceLanguage: currentInvoiceLanguage
        });
        showToast("Currency settings saved.");
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Settings</h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">Manage your application settings and data.</p>

            <div className="mt-8 space-y-8">
                <Card>
                    <form onSubmit={handleSaveCompanyInfo}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Company Information</h3>
                            {!isEditingCompany && (
                                <Button type="button" variant="secondary" onClick={() => setIsEditingCompany(true)}>Edit</Button>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="companyName">Company Name</Label>
                                <Input id="companyName" type="text" value={companyForm.companyName} onChange={handleCompanyInfoChange} disabled={!isEditingCompany} />
                            </div>
                            <div>
                                <Label htmlFor="companyEmail">Company Email</Label>
                                <Input id="companyEmail" type="email" value={companyForm.companyEmail} onChange={handleCompanyInfoChange} disabled={!isEditingCompany} />
                            </div>
                             <div>
                                <Label htmlFor="companyAddress">Company Address</Label>
                                <Textarea id="companyAddress" value={companyForm.companyAddress} onChange={handleCompanyInfoChange} disabled={!isEditingCompany} />
                            </div>
                             <div>
                                <Label htmlFor="logo">Company Logo</Label>
                                <div className="flex items-center gap-4">
                                    {companyForm.logo && (
                                        <img src={companyForm.logo} alt="Logo Preview" className="h-16 w-16 object-contain rounded-md bg-slate-100 dark:bg-slate-700 p-1" />
                                    )}
                                    <Input id="logo" type="file" accept="image/*" onChange={handleLogoChange} disabled={!isEditingCompany} className="flex-1" />
                                </div>
                            </div>
                             {isEditingCompany && (
                                <div className="flex justify-end gap-4 pt-4">
                                    <Button type="button" variant="secondary" onClick={() => { setIsEditingCompany(false); setCompanyForm(userProfile); }}>Cancel</Button>
                                    <Button type="submit">Save Changes</Button>
                                </div>
                            )}
                        </div>
                    </form>
                </Card>
                
                 <Card>
                    <form onSubmit={handleSaveCurrencySettings}>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Financial & Invoice Settings</h3>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="defaultCurrency">Default Currency</Label>
                                <Select id="defaultCurrency" value={currentDefaultCurrency} onChange={e => setCurrentDefaultCurrency(e.target.value)}>
                                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                                </Select>
                            </div>

                            {/* NEW INVOICE LANGUAGE SELECTOR */}
                            <div>
                                <Label htmlFor="invoiceLanguage">Invoice Output Language</Label>
                                <Select id="invoiceLanguage" value={currentInvoiceLanguage} onChange={e => setCurrentInvoiceLanguage(e.target.value)}>
                                    <option value="en">English</option>
                                    <option value="de">German</option>
                                </Select>
                            </div>

                             <div className="text-right">
                                <Button type="submit">Save Settings</Button>
                            </div>
                        </div>
                    </form>
                    <form onSubmit={handleSaveFinancialSettings} className="mt-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="taxRate">Estimated Tax Rate (%)</Label>
                                    <Input id="taxRate" type="number" value={currentTaxRate} onChange={e => setCurrentTaxRate(e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="internalCostRate">Internal Cost Rate (in default currency)/hr</Label>
                                    <Input id="internalCostRate" type="number" value={currentInternalCostRate} onChange={e => setCurrentInternalCostRate(e.target.value)} />
                                </div>
                            </div>
                            <div className="text-right">
                                <Button type="submit">Save Financials</Button>
                            </div>
                        </div>
                    </form>
                </Card>

                 <Card>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Data Management</h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input type="file" accept=".json" ref={inputFileRef} style={{ display: 'none' }} onChange={handleFileChange} />
                       <Button onClick={onExport} className="flex-1">Export Data</Button>
                       <Button variant="secondary" onClick={onImportClick} className="flex-1">Import Data</Button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">Export your data to a JSON file for backup. Importing will overwrite existing data.</p>
                </Card>
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENT ---

const App = () => {
    const [activeView, setActiveView] = useState('dashboard');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [data, setData] = useState({
        clients: initialClients,
        projects: initialProjects,
        timeEntries: initialTimeEntries,
        invoices: initialInvoices,
        expenses: initialExpenses,
        userProfile: initialUserProfile,
        recurringInvoices: initialRecurringInvoices,
        taxSettings: initialTaxSettings,
        currencySettings: initialCurrencySettings,
    });

    const { clients, projects, timeEntries, invoices, expenses, userProfile, recurringInvoices, taxSettings, currencySettings } = data;

    const setClients = (newClients) => setData(d => ({ ...d, clients: typeof newClients === 'function' ? newClients(d.clients) : newClients }));
    const setProjects = (newProjects) => setData(d => ({ ...d, projects: typeof newProjects === 'function' ? newProjects(d.projects) : newProjects }));
    const setTimeEntries = (newTimeEntries) => setData(d => ({ ...d, timeEntries: typeof newTimeEntries === 'function' ? newTimeEntries(d.timeEntries) : newTimeEntries }));
    const setInvoices = (newInvoices) => setData(d => ({ ...d, invoices: typeof newInvoices === 'function' ? newInvoices(d.invoices) : newInvoices }));
    const setExpenses = (newExpenses) => setData(d => ({ ...d, expenses: typeof newExpenses === 'function' ? newExpenses(d.expenses) : newExpenses }));
    const setUserProfile = (newUserProfile) => setData(d => ({ ...d, userProfile: typeof newUserProfile === 'function' ? newUserProfile(d.userProfile) : newUserProfile }));
    const setRecurringInvoices = (newRecurringInvoices) => setData(d => ({ ...d, recurringInvoices: typeof newRecurringInvoices === 'function' ? newRecurringInvoices(d.recurringInvoices) : newRecurringInvoices }));
    const setTaxSettings = (newTaxSettings) => setData(d => ({ ...d, taxSettings: typeof newTaxSettings === 'function' ? newTaxSettings(d.taxSettings) : newTaxSettings }));
    const setCurrencySettings = (newCurrencySettings) => setData(d => ({ ...d, currencySettings: typeof newCurrencySettings === 'function' ? newCurrencySettings(d.currencySettings) : newCurrencySettings }));


    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerStartTime, setTimerStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [timerProjectId, setTimerProjectId] = useState(null);

    const showToast = (message) => {
        setToastMessage(message);
    };

    useEffect(() => {
        invoke('load_data').then(savedData => {
            if (savedData) {
                try {
                    const parsedData = JSON.parse(savedData);
                    // If the file is empty or just "{}", we don't want to overwrite the initial state
                    if (Object.keys(parsedData).length > 0) {
                        setData(parsedData);
                    }
                } catch (e) {
                    console.error("Failed to parse saved data:", e);
                }
            }
        }).catch(console.error).finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        if (projects.length > 0 && !timerProjectId) {
            setTimerProjectId(projects[0].id);
        }
    }, [projects, timerProjectId]);

    useEffect(() => {
        if (!isLoading) {
            invoke('save_data', { data: JSON.stringify(data) });
        }
    }, [data, isLoading]);

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
    }, [isTimerRunning, timerStartTime]);
    
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
        return projects.reduce((acc, project) => {
            const clientName = project.client;
            if (clientName) {
                acc[clientName] = (acc[clientName] || 0) + 1;
            }
            return acc;
        }, {});
    }, [projects]);

    const renderView = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-64"><p className="text-xl text-slate-500">Loading your data...</p></div>;
        }
        
        switch (activeView) {
            case 'dashboard': return <DashboardView projects={projects} clients={clients} timeEntries={timeEntries} invoices={invoices} taxSettings={taxSettings} currencySettings={currencySettings} />;
            case 'projects': return <ProjectsView projects={projects} setProjects={setProjects} clients={clients} currencySettings={currencySettings} showToast={showToast} />;
            case 'clients': return <ClientsView clients={clients} setClients={setClients} projects={projects} setProjects={setProjects} showToast={showToast} clientProjectCounts={clientProjectCounts} />;
            case 'invoices': return <InvoicesView projects={projects} clients={clients} timeEntries={timeEntries} setTimeEntries={setTimeEntries} invoices={invoices} setInvoices={setInvoices} expenses={expenses} setExpenses={setExpenses} userProfile={userProfile} recurringInvoices={recurringInvoices} setRecurringInvoices={setRecurringInvoices} showToast={showToast} currencySettings={currencySettings} taxSettings={taxSettings} />;
            case 'timetracking': return <TimeTrackingView
                projects={projects}
                setProjects={setProjects}
                timeEntries={timeEntries}
                setTimeEntries={setTimeEntries}
                showToast={showToast}
                isTimerRunning={isTimerRunning}
                setIsTimerRunning={setIsTimerRunning}
                timerStartTime={timerStartTime}
                setTimerStartTime={setTimerStartTime}
                elapsedTime={elapsedTime}
                setElapsedTime={setElapsedTime}
                timerProjectId={timerProjectId}
                setTimerProjectId={setTimerProjectId}
            />;
            case 'reporting': return <ReportingView projects={projects} clients={clients} timeEntries={timeEntries} expenses={expenses} taxSettings={taxSettings} />;
            case 'expenses': return <ExpensesView projects={projects} setExpenses={setExpenses} expenses={expenses} showToast={showToast} />;
            case 'settings': return <SettingsView userProfile={userProfile} setUserProfile={setUserProfile} taxSettings={taxSettings} setTaxSettings={setTaxSettings} currencySettings={currencySettings} setCurrencySettings={setCurrencySettings} showToast={showToast} onImport={handleImport} onExport={handleExportData} />;
            default: return <DashboardView projects={projects} clients={clients} />;
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
