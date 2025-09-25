export const initialClients = [
    { id: "client-1", name: "Test Client", email: "test@client.com" }
];

export const initialProjects = [
    { id: "project-1", name: "Test Project", clientId: "client-1", rate: 100 }
];

export const initialTimeEntries = [
    { id: "time-1", project_id: "project-1", start_time: new Date().toISOString(), end_time: new Date(Date.now() + 1000 * 60 * 60).toISOString(), hours: 1, isBilled: false, invoiceId: null }
];

export const initialInvoices = [];

export const initialExpenses = [];

export const initialUserProfile = {
    companyName: 'Your Company',
    companyEmail: 'your.email@example.com',
    companyAddress: '123 Freelance St, Work City',
    logo: null,
};

export const initialRecurringInvoices = [];

export const initialTaxSettings = {
    rate: 25,
};

export const initialProfitabilitySettings = {
    internalCostRate: 50, // Default internal cost per hour for profitability
}

export const initialCurrencySettings = {
    default: 'USD',
    invoiceLanguage: 'en',
};