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

// The state that will be persisted
const getPersistentState = (state) => ({
    clients: state.clients,
    projects: state.projects,
    timeEntries: state.timeEntries,
    invoices: state.invoices,
    expenses: state.expenses,
    userProfile: state.userProfile,
    recurringInvoices: state.recurringInvoices,
    taxSettings: state.taxSettings,
    currencySettings: state.currencySettings,
});


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
            const data = await invoke('load_all_data');
            // Check if data is not null or empty
            if (data && Object.keys(data).length > 0) {
                set({ ...data, isLoading: false });
            } else {
                set({ isLoading: false }); // First launch or empty data file
            }
        } catch (error) {
            console.error('Failed to load initial data (this is normal on first launch):', error);
            set({ isLoading: false });
        }
    },

    // Client Actions
    addClient: (name, email) => {
        const id = crypto.randomUUID();
        set((state) => ({ clients: [...state.clients, { id, name, email }] }));
    },
    updateClient: (id, name, email) => {
        set((state) => ({
            clients: state.clients.map((c) => (c.id === id ? { ...c, name, email } : c)),
        }));
    },
    deleteClient: (id) => {
        set((state) => ({
            clients: state.clients.filter((c) => c.id !== id),
        }));
    },

    // Project Actions
    addProject: (name, clientId, rate) => {
        const id = crypto.randomUUID();
        set((state) => ({ projects: [...state.projects, { id, name, clientId, rate }] }));
    },
    updateProject: (id, name, clientId, rate) => {
        set((state) => ({
            projects: state.projects.map((p) => (p.id === id ? { ...p, name, clientId, rate } : p)),
        }));
    },
    deleteProject: (id) => {
        set((state) => ({
            projects: state.projects.filter((p) => p.id !== id),
        }));
    },

    // Time Entry Actions
    addTimeEntry: (projectId, startTime, endTime) => {
        const id = crypto.randomUUID();
        set((state) => ({ timeEntries: [...state.timeEntries, { id, projectId, startTime, endTime }] }));
    },
    updateTimeEntry: (id, projectId, startTime, endTime) => {
        set((state) => ({
            timeEntries: state.timeEntries.map((t) => (t.id === id ? { ...t, projectId, startTime, endTime } : t)),
        }));
    },
    deleteTimeEntry: (id) => {
        set((state) => ({
            timeEntries: state.timeEntries.filter((t) => t.id !== id),
        }));
    },

    // Invoice Actions
    addInvoice: (invoice) => {
        const newInvoice = { ...invoice, id: invoice.id || crypto.randomUUID() };
        set((state) => ({ invoices: [...state.invoices, newInvoice] }));
    },
    updateInvoice: (invoice) => {
        set((state) => ({
            invoices: state.invoices.map((i) => (i.id === invoice.id ? invoice : i)),
        }));
    },
    deleteInvoice: (id) => {
        set((state) => ({
            invoices: state.invoices.filter((i) => i.id !== id),
        }));
    },

    // Expense Actions
    addExpense: (expense) => {
        const newExpense = { ...expense, id: expense.id || crypto.randomUUID() };
        set((state) => ({ expenses: [...state.expenses, newExpense] }));
    },
    updateExpense: (expense) => {
        set((state) => ({
            expenses: state.expenses.map((e) => (e.id === expense.id ? expense : e)),
        }));
    },
    deleteExpense: (id) => {
        set((state) => ({
            expenses: state.expenses.filter((e) => e.id !== id),
        }));
    },

    // User Profile Actions
    updateUserProfile: (profile) => {
        set({ userProfile: profile });
    },

    // Recurring Invoice Actions
    addRecurringInvoice: (invoice) => {
        const newInvoice = { ...invoice, id: invoice.id || crypto.randomUUID() };
        set((state) => ({ recurringInvoices: [...state.recurringInvoices, newInvoice] }));
    },
    updateRecurringInvoice: (invoice) => {
        set((state) => ({
            recurringInvoices: state.recurringInvoices.map((i) => (i.id === invoice.id ? invoice : i)),
        }));
    },
    deleteRecurringInvoice: (id) => {
        set((state) => ({
            recurringInvoices: state.recurringInvoices.filter((i) => i.id !== id),
        }));
    },

    // Tax Settings Actions
    updateTaxSettings: (settings) => {
        set({ taxSettings: settings });
    },

    // Currency Settings Actions
    updateCurrencySettings: (settings) => {
        set({ currencySettings: settings });
    },
}));

// --- PERSISTENCE ---
// Subscribe to the store to save state changes to the backend.
if (isTauri()) {
    useStore.subscribe(
        (state) => {
            // Avoid saving during initial data load
            if (!state.isLoading) {
                const dataToSave = getPersistentState(state);
                invoke('save_all_data', { data: dataToSave }).catch((error) => {
                    console.error('Failed to save data:', error);
                });
            }
        }
    );
}

export default useStore;