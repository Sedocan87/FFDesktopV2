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
    initialProfitabilitySettings,
} from '../lib/initialData';

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
    profitabilitySettings: state.profitabilitySettings,
});

const useStore = create((set, get) => ({
    clients: initialClients,
    projects: initialProjects,
    timeEntries: initialTimeEntries,
    invoices: initialInvoices,
    expenses: initialExpenses,
    userProfile: initialUserProfile,
    recurringInvoices: initialRecurringInvoices,
    taxSettings: initialTaxSettings,
    currencySettings: initialCurrencySettings,
    profitabilitySettings: initialProfitabilitySettings,
    isLoading: true,
    isTimerRunning: false,
    timerStartTime: null,
    elapsedTime: 0,
    timerProjectId: null,
    isNewInvoiceDialogOpen: false,
    isNewProjectDialogOpen: false,
    isLogTimeDialogOpen: false,
    isAddExpenseDialogOpen: false,
    editingProject: null,
    editingExpense: null,
    setEditingProject: (project) => set({ editingProject: project }),
    setEditingExpense: (expense) => set({ editingExpense: expense }),
    setIsNewInvoiceDialogOpen: (isOpen) => set({ isNewInvoiceDialogOpen: isOpen }),
    setIsNewProjectDialogOpen: (isOpen) => set({ isNewProjectDialogOpen: isOpen }),
    setIsLogTimeDialogOpen: (isOpen) => set({ isLogTimeDialogOpen: isOpen }),
    setIsAddExpenseDialogOpen: (isOpen) => set({ isAddExpenseDialogOpen: isOpen }),
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
    setProfitabilitySettings: (newProfitabilitySettings) => set(state => ({ profitabilitySettings: typeof newProfitabilitySettings === 'function' ? newProfitabilitySettings(state.profitabilitySettings) : newProfitabilitySettings })),
    setIsTimerRunning: (isRunning) => set({ isTimerRunning: isRunning }),
    setTimerStartTime: (startTime) => set({ timerStartTime: startTime }),
    setElapsedTime: (time) => set({ elapsedTime: time }),
    setTimerProjectId: (projectId) => set({ timerProjectId: projectId }),

    getInvoicesWithRecurring: () => {
        const { invoices, recurringInvoices } = get();
        const generatedInvoices = [];
        const today = new Date();

        recurringInvoices.forEach(rec => {
            let currentDate = new Date(rec.nextDueDate);
            while (currentDate <= today) {
                generatedInvoices.push({
                    ...rec,
                    id: `${rec.id}-${currentDate.toISOString().split('T')[0]}`,
                    issueDate: currentDate.toISOString().split('T')[0],
                    status: rec.status === 'Paid' ? 'Paid' : 'Draft',
                });

                if (rec.frequency === 'Monthly') {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                } else if (rec.frequency === 'Quarterly') {
                    currentDate.setMonth(currentDate.getMonth() + 3);
                } else if (rec.frequency === 'Annually') {
                    currentDate.setFullYear(currentDate.getFullYear() + 1);
                } else {
                    break;
                }
            }
        });

        return [...invoices, ...generatedInvoices];
    },

    loadInitialData: async () => {
        if (isTauri()) {
            set({ isLoading: true });
            try {
                const data = await invoke('load_all_data');
                if (data && Object.keys(data).length > 0) {
                    set({ ...data, isLoading: false });
                } else {
                    set({ isLoading: false });
                }
            } catch (error) {
                console.error('Failed to load initial data from Tauri:', error);
                set({ isLoading: false });
            }
        } else {
            try {
                const savedState = localStorage.getItem('freelanceFlowState');
                if (savedState) {
                    set({ ...JSON.parse(savedState), isLoading: false });
                } else {
                    set({ isLoading: false });
                }
            } catch (error) {
                console.error('Failed to load data from localStorage:', error);
                set({ isLoading: false });
            }
        }
    },

    addClient: (name, email) => set((state) => ({ clients: [...state.clients, { id: crypto.randomUUID(), name, email, isArchived: false }] })),
    updateClient: (id, name, email) => set((state) => ({ clients: state.clients.map((c) => (c.id === id ? { ...c, name, email } : c)) })),
    deleteClient: (id) => set((state) => {
        const projectsToDelete = state.projects.filter((p) => p.clientId === id);
        const projectIdsToDelete = projectsToDelete.map((p) => p.id);

        return {
            clients: state.clients.filter((c) => c.id !== id),
            projects: state.projects.filter((p) => p.clientId !== id),
            invoices: state.invoices.filter((i) => i.projectIds && !i.projectIds.some(pid => projectIdsToDelete.includes(pid))),
            timeEntries: state.timeEntries.filter((t) => !projectIdsToDelete.includes(t.projectId)),
            expenses: state.expenses.filter((e) => !projectIdsToDelete.includes(e.projectId)),
        };
    }),
    addProject: (name, clientId, rate) => set((state) => ({ projects: [...state.projects, { id: crypto.randomUUID(), name, clientId, rate, isArchived: false }] })),
    updateProject: (id, name, clientId, rate) => set((state) => ({ projects: state.projects.map((p) => (p.id === id ? { ...p, name, clientId, rate } : p)) })),
    deleteProject: (id) => set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        invoices: state.invoices.filter((i) => i.projectIds && !i.projectIds.includes(id)),
        timeEntries: state.timeEntries.filter((t) => t.projectId !== id),
        expenses: state.expenses.filter((e) => e.projectId !== id),
    })),
    addTimeEntry: (projectId, startTime, endTime, hours) => set((state) => ({ timeEntries: [...state.timeEntries, { id: crypto.randomUUID(), projectId, startTime, endTime, hours, isArchived: false }] })),
    updateTimeEntry: (id, projectId, startTime, endTime, hours) => set((state) => ({ timeEntries: state.timeEntries.map((t) => (t.id === id ? { ...t, projectId, startTime, endTime, hours } : t)) })),
    deleteTimeEntry: (id) => set((state) => ({ timeEntries: state.timeEntries.filter((t) => t.id !== id) })),
    addInvoice: (invoice) => set((state) => ({ invoices: [...state.invoices, { ...invoice, id: invoice.id || crypto.randomUUID(), isArchived: false }] })),
    updateInvoice: (invoice) => set((state) => ({ invoices: state.invoices.map((i) => (i.id === invoice.id ? invoice : i)) })),
    deleteInvoice: (id) => set((state) => ({ invoices: state.invoices.filter((i) => i.id !== id) })),
    addExpense: (expense) => set((state) => ({ expenses: [...state.expenses, { ...expense, id: expense.id || crypto.randomUUID(), isArchived: false }] })),
    updateExpense: (expense) => set((state) => ({ expenses: state.expenses.map((e) => (e.id === expense.id ? expense : e)) })),
    deleteExpense: (id) => set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) })),

    archiveClient: (id) => set((state) => {
        const clientToArchive = state.clients.find((c) => c.id === id);
        if (!clientToArchive) return {};

        return {
            clients: state.clients.map((c) => (c.id === id ? { ...c, isArchived: true } : c)),
            projects: state.projects.map((p) => (p.clientId === id ? { ...p, isArchived: true } : p)),
            recurringInvoices: state.recurringInvoices.map((ri) => (ri.clientName === clientToArchive.name ? { ...ri, isArchived: true } : ri)),
        };
    }),
    unarchiveClient: (id) => set((state) => {
        const clientToUnarchive = state.clients.find((c) => c.id === id);
        if (!clientToUnarchive) return {};

        return {
            clients: state.clients.map((c) => (c.id === id ? { ...c, isArchived: false } : c)),
            projects: state.projects.map((p) => (p.clientId === id ? { ...p, isArchived: false } : p)),
            recurringInvoices: state.recurringInvoices.map((ri) => (ri.clientName === clientToUnarchive.name ? { ...ri, isArchived: false } : ri)),
        };
    }),

    archiveProject: (id) => set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? { ...p, isArchived: true } : p)),
    })),
    unarchiveProject: (id) => set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? { ...p, isArchived: false } : p)),
    })),

    archiveRecurringInvoice: (id) => set((state) => ({ recurringInvoices: state.recurringInvoices.map((i) => (i.id === id ? { ...i, isArchived: true } : i)) })),
    unarchiveRecurringInvoice: (id) => set((state) => ({ recurringInvoices: state.recurringInvoices.map((i) => (i.id === id ? { ...i, isArchived: false } : i)) })),

    updateUserProfile: (profile) => set({ userProfile: profile }),
    addRecurringInvoice: (invoice) => set((state) => ({ recurringInvoices: [...state.recurringInvoices, { ...invoice, id: invoice.id || crypto.randomUUID() }] })),
    updateRecurringInvoice: (invoice) => set((state) => ({ recurringInvoices: state.recurringInvoices.map((i) => (i.id === invoice.id ? invoice : i)) })),
    deleteRecurringInvoice: (id) => set((state) => ({ recurringInvoices: state.recurringInvoices.filter((i) => i.id !== id) })),
    updateTaxSettings: (settings) => set({ taxSettings: settings }),
    updateCurrencySettings: (settings) => set({ currencySettings: settings }),
    updateProfitabilitySettings: (settings) => set({ profitabilitySettings: settings }),
}));

if (isTauri()) {
    useStore.subscribe((state) => {
        if (!state.isLoading) {
            const dataToSave = getPersistentState(state);
            invoke('save_all_data', { data: dataToSave }).catch((error) => {
                console.error('Failed to save data to Tauri:', error);
            });
        }
    });
} else {
    useStore.subscribe((state) => {
        if (!state.isLoading) {
            const dataToSave = getPersistentState(state);
            localStorage.setItem('freelanceFlowState', JSON.stringify(dataToSave));
        }
    });
}

export default useStore;