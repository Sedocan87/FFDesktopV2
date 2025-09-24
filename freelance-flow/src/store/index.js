import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
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

    loadData: async () => {
        try {
            const savedData = await invoke('load_data');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                if (Object.keys(parsedData).length > 0) {
                    set(parsedData);
                }
            }
        } catch (e) {
            console.error("Failed to parse saved data:", e);
        } finally {
            set({ isLoading: false });
        }
    },

    saveData: async () => {
        const {
            clients, projects, timeEntries, invoices, expenses, userProfile,
            recurringInvoices, taxSettings, currencySettings
        } = get();
        const dataToSave = {
            clients, projects, timeEntries, invoices, expenses, userProfile,
            recurringInvoices, taxSettings, currencySettings
        };
        await invoke('save_data', { data: JSON.stringify(dataToSave) });
    },
}));

export default useStore;