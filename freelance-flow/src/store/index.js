import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { isTauri } from '../lib/tauri';
import {
    initialClients,
    initialProjects,
    initialTimeEntries,
    initialInvoices,
    initialExpenses,
    initialUserProfile,
    initialRecurringInvoices,
    initialTaxSettings,
    initialCurrencySettings,
} from '../lib/initialData';

const useStore = create((set, get) => ({
    // --- STATE ---
    clients: initialClients,
    projects: initialProjects,
    timeEntries: initialTimeEntries,
    invoices: initialInvoices,
    expenses: initialExpenses,
    userProfile: initialUserProfile,
    recurringInvoices: initialRecurringInvoices,
    taxSettings: initialTaxSettings,
    currencySettings: initialCurrencySettings,

    isLoading: true,
    isTimerRunning: false,
    timerStartTime: null,
    elapsedTime: 0,
    timerProjectId: null,

    // --- ACTIONS ---
    setData: (data) => set(data),

    setClients: (newClients) => set(state => ({ clients: typeof newClients === 'function' ? newClients(state.clients) : newClients })),
    setProjects: (newProjects) => set(state => ({ projects: typeof newProjects === 'function' ? newProjects(state.projects) : newProjects })),
    setTimeEntries: (newTimeEntries) => set(state => ({ timeEntries: typeof newTimeEntries === 'function' ? newTimeEntries(state.timeEntries) : newTimeEntries })),
    setInvoices: (newInvoices) => set(state => ({ invoices: typeof newInvoices === 'function' ? newInvoices(state.invoices) : newInvoices })),
    setExpenses: (newExpenses) => set(state => ({ expenses: typeof newExpenses === 'function' ? newExpenses(state.expenses) : newExpenses })),
    setUserProfile: (newUserProfile) => set(state => ({ userProfile: typeof newUserProfile === 'function' ? newUserProfile(state.userProfile) : newUserProfile })),
    setRecurringInvoices: (newRecurringInvoices) => set(state => ({ recurringInvoices: typeof newRecurringInvoices === 'function' ? newRecurringInvoices(state.recurringInvoices) : newRecurringInvoices })),
    setTaxSettings: (newTaxSettings) => set(state => ({ taxSettings: typeof newTaxSettings === 'function' ? newTaxSettings(state.taxSettings) : newTaxSettings })),
    setCurrencySettings: (newCurrencySettings) => set(state => ({ currencySettings: typeof newCurrencySettings === 'function' ? newCurrencySettings(state.currencySettings) : newCurrencySettings })),

    setIsTimerRunning: (isRunning) => set({ isTimerRunning: isRunning }),
    setTimerStartTime: (startTime) => set({ timerStartTime: startTime }),
    setElapsedTime: (time) => set({ elapsedTime: time }),
    setTimerProjectId: (projectId) => set({ timerProjectId: projectId }),

    loadInitialData: async () => {
        if (!isTauri()) {
            set({ isLoading: false });
            return;
        }
        set({ isLoading: true });
        try {
            const [
                clients,
                projects,
                timeEntries,
                invoices,
                expenses,
                userProfile,
                recurringInvoices,
                taxSettings,
                currencySettings,
            ] = await Promise.all([
                invoke('get_clients'),
                invoke('get_projects'),
                invoke('get_time_entries'),
                invoke('get_invoices'),
                invoke('get_expenses'),
                invoke('get_user_profile'),
                invoke('get_recurring_invoices'),
                invoke('get_tax_settings'),
                invoke('get_currency_settings'),
            ]);
            set({
                clients,
                projects,
                timeEntries,
                invoices,
                expenses,
                userProfile,
                recurringInvoices,
                taxSettings,
                currencySettings,
                isLoading: false,
            });
        } catch (error) {
            console.error('Failed to load initial data:', error);
            set({ isLoading: false });
        }
    },

    // Client Actions
    addClient: async (name, email) => {
        const id = await invoke('add_client', { name, email });
        set((state) => ({ clients: [...state.clients, { id, name, email }] }));
    },
    updateClient: async (id, name, email) => {
        await invoke('update_client', { id, name, email });
        set((state) => ({
            clients: state.clients.map((c) => (c.id === id ? { ...c, name, email } : c)),
        }));
    },
    deleteClient: async (id) => {
        await invoke('delete_client', { id });
        set((state) => ({
            clients: state.clients.filter((c) => c.id !== id),
        }));
    },

    // Project Actions
    addProject: async (name, clientId, rate) => {
        const id = await invoke('add_project', { name, clientId, rate });
        set((state) => ({ projects: [...state.projects, { id, name, clientId, rate }] }));
    },
    updateProject: async (id, name, clientId, rate) => {
        await invoke('update_project', { id, name, clientId, rate });
        set((state) => ({
            projects: state.projects.map((p) => (p.id === id ? { ...p, name, clientId, rate } : p)),
        }));
    },
    deleteProject: async (id) => {
        await invoke('delete_project', { id });
        set((state) => ({
            projects: state.projects.filter((p) => p.id !== id),
        }));
    },

    // Time Entry Actions
    addTimeEntry: async (projectId, startTime, endTime) => {
        const id = await invoke('add_time_entry', { projectId, startTime, endTime });
        set((state) => ({ timeEntries: [...state.timeEntries, { id, projectId, startTime, endTime }] }));
    },
    updateTimeEntry: async (id, projectId, startTime, endTime) => {
        await invoke('update_time_entry', { id, projectId, startTime, endTime });
        set((state) => ({
            timeEntries: state.timeEntries.map((t) => (t.id === id ? { ...t, projectId, startTime, endTime } : t)),
        }));
    },
    deleteTimeEntry: async (id) => {
        await invoke('delete_time_entry', { id });
        set((state) => ({
            timeEntries: state.timeEntries.filter((t) => t.id !== id),
        }));
    },

    // Invoice Actions
    addInvoice: async (invoice) => {
        await invoke('add_invoice', { invoice });
        set((state) => ({ invoices: [...state.invoices, invoice] }));
    },
    updateInvoice: async (invoice) => {
        await invoke('update_invoice', { invoice });
        set((state) => ({
            invoices: state.invoices.map((i) => (i.id === invoice.id ? invoice : i)),
        }));
    },
    deleteInvoice: async (id) => {
        await invoke('delete_invoice', { id });
        set((state) => ({
            invoices: state.invoices.filter((i) => i.id !== id),
        }));
    },

    // Expense Actions
    addExpense: async (expense) => {
        await invoke('add_expense', { expense });
        set((state) => ({ expenses: [...state.expenses, expense] }));
    },
    updateExpense: async (expense) => {
        await invoke('update_expense', { expense });
        set((state) => ({
            expenses: state.expenses.map((e) => (e.id === expense.id ? expense : e)),
        }));
    },
    deleteExpense: async (id) => {
        await invoke('delete_expense', { id });
        set((state) => ({
            expenses: state.expenses.filter((e) => e.id !== id),
        }));
    },

    // User Profile Actions
    updateUserProfile: async (profile) => {
        await invoke('update_user_profile', { profile });
        set({ userProfile: profile });
    },

    // Recurring Invoice Actions
    addRecurringInvoice: async (invoice) => {
        await invoke('add_recurring_invoice', { invoice });
        set((state) => ({ recurringInvoices: [...state.recurringInvoices, invoice] }));
    },
    updateRecurringInvoice: async (invoice) => {
        await invoke('update_recurring_invoice', { invoice });
        set((state) => ({
            recurringInvoices: state.recurringInvoices.map((i) => (i.id === invoice.id ? invoice : i)),
        }));
    },
    deleteRecurringInvoice: async (id) => {
        await invoke('delete_recurring_invoice', { id });
        set((state) => ({
            recurringInvoices: state.recurringInvoices.filter((i) => i.id !== id),
        }));
    },

    // Tax Settings Actions
    updateTaxSettings: async (settings) => {
        await invoke('update_tax_settings', { settings });
        set({ taxSettings: settings });
    },

    // Currency Settings Actions
    updateCurrencySettings: async (settings) => {
        await invoke('update_currency_settings', { settings });
        set({ currencySettings: settings });
    },
}));

export default useStore;