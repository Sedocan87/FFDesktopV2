export const initialClients = [
    { id: 1, name: 'Innovate Inc.', email: 'contact@innovate.com' },
    { id: 2, name: 'Quantum Solutions', email: 'hello@quantum.dev' },
    { id: 3, name: 'Apex Designs', email: 'support@apexdesigns.io' },
    { id: 4, name: 'New Client', email: 'new@client.com' },
];

export const initialProjects = [
    { id: 1, name: 'Mobile App Redesign', client: 'Apex Designs', status: 'In Progress', tracked: 25.5, billing: { type: 'Hourly', rate: 120 }, budget: null, currency: 'USD' },
    { id: 2, name: 'E-commerce Platform', client: 'Innovate Inc.', status: 'Completed', tracked: 120, billing: { type: 'Fixed Price'}, budget: 15000, currency: 'USD' },
    { id: 3, name: 'Marketing Website', client: 'Innovate Inc.', status: 'In Progress', tracked: 12.0, billing: { type: 'Hourly', rate: 90 }, budget: null, currency: 'EUR' },
    { id: 4, name: 'Data Analytics Dashboard', client: 'Quantum Solutions', status: 'Planning', tracked: 5.2, billing: { type: 'Hourly', rate: 150 }, budget: null, currency: 'USD' },
    { id: 5, name: 'Brand Identity', client: 'Apex Designs', status: 'Completed', tracked: 40.0, billing: { type: 'Fixed Price'}, budget: 5000, currency: 'GBP' },
    { id: 6, name: 'Internal CRM', client: 'Apex Designs', status: 'On Hold', tracked: 0, billing: { type: 'Hourly', rate: 100 }, budget: null, currency: 'USD' },
];

export const initialTimeEntries = [
    { id: 1, projectId: 1, hours: 2.5, date: '2025-09-18', description: 'Worked on UI mockups for the home screen.', isBilled: false },
    { id: 2, projectId: 3, hours: 4.0, date: '2025-09-18', description: 'Initial project setup and dependency installation.', isBilled: false },
    { id: 3, projectId: 1, hours: 3.0, date: '2025-09-17', description: 'Client meeting to discuss feedback on wireframes.', isBilled: false },
    { id: 4, projectId: 2, hours: 8.0, date: '2025-07-16', description: 'Deployed final version to production.', isBilled: true },
    { id: 5, projectId: 4, hours: 5.2, date: '2025-08-15', description: 'Initial data modeling.', isBilled: false },
    { id: 6, projectId: 3, hours: 3.5, date: '2025-09-12', description: 'Set up staging environment.', isBilled: false },
    { id: 7, projectId: 1, hours: 5.0, date: '2025-09-11', description: 'Component library research.', isBilled: false },
];

export const initialInvoices = [
    { id: 'INV-001', clientName: 'Innovate Inc.', issueDate: '2025-07-17', dueDate: '2025-08-17', amount: 950.00, status: 'Paid', currency: 'USD', items: []},
    { id: 'INV-002', clientName: 'Quantum Solutions', issueDate: '2025-08-20', dueDate: '2025-09-20', amount: 780.00, status: 'Paid', currency: 'USD', items: []},
];

export const initialExpenses = [
    { id: 1, projectId: 1, description: 'Stock Photos License', amount: 75.00, date: '2025-09-10', isBilled: false, isBillable: true },
    { id: 2, projectId: 3, description: 'Premium WordPress Plugin', amount: 59.99, date: '2025-09-12', isBilled: false, isBillable: true },
    { id: 3, projectId: 2, description: 'Server Hosting (Q3)', amount: 150.00, date: '2025-07-01', isBilled: true, isBillable: true },
    { id: 4, projectId: 1, description: 'New Keyboard', amount: 120.00, date: '2025-09-15', isBilled: false, isBillable: false },
];

export const initialUserProfile = {
    companyName: 'Your Company',
    companyEmail: 'your.email@example.com',
    companyAddress: '123 Freelance St, Work City',
    logo: null,
};

export const initialRecurringInvoices = [
    { id: 1, clientName: 'Innovate Inc.', frequency: 'Monthly', nextDueDate: '2025-10-01', amount: 2500, items: [{ description: 'Monthly Marketing Retainer', amount: 2500 }], currency: 'USD' },
    { id: 2, clientName: 'Apex Designs', frequency: 'Quarterly', nextDueDate: '2025-11-15', amount: 750, items: [{ description: 'Quarterly Website Maintenance', amount: 750 }], currency: 'GBP' },
];

export const initialTaxSettings = {
    rate: 25,
    internalCostRate: 50, // Default internal cost per hour for profitability
};

export const initialCurrencySettings = {
    default: 'USD',
    invoiceLanguage: 'en',
};