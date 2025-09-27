import React, { useState, useMemo, useEffect } from 'react';
import useStore from '../store';
import Button from '../components/Button';
import Dialog from '../components/Dialog';
import Select from '../components/Select';
import Label from '../components/Label';
import BillableItemsModal from './BillableItemsModal';

const NewInvoiceDialog = ({ showToast }) => {
    const { clients, projects, timeEntries, expenses, currencySettings, setTimeEntries, setExpenses, addInvoice, isNewInvoiceDialogOpen, setIsNewInvoiceDialogOpen } = useStore();
    const [selectedClient, setSelectedClient] = useState(clients.length > 0 ? clients[0].id : '');
    const [isBillableModalOpen, setIsBillableModalOpen] = useState(false);
    const [itemsToBill, setItemsToBill] = useState({ entries: [], expenses: [] });

    const activeClients = useMemo(() => clients.filter(c => !c.isArchived), [clients]);

    useEffect(() => {
        if (activeClients.length > 0) {
            setSelectedClient(activeClients[0].id);
        }
    }, [activeClients]);

    const projectMap = useMemo(() => projects.reduce((acc, proj) => {
        acc[proj.id] = proj;
        return acc;
    }, {}), [projects]);

    const handleCreateInvoiceFromSelectedItems = async (selectedEntries, selectedExpenses, showToast) => {
        if (!selectedClient) return;

        const clientObj = clients.find(c => c.id === selectedClient);
        if (!clientObj) return;

        if (selectedEntries.length === 0 && selectedExpenses.length === 0) {
            showToast(`No items selected to invoice.`);
            return;
        }

        const timeInvoiceItems = selectedEntries.map(entry => {
            const project = projectMap[entry.projectId];
            const rate = project.rate; // Use the rate from the project
            return {
                id: `time-${entry.id}`,
                description: `${project?.name || 'Project'} - Work done on`,
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

        const projectIds = [
            ...new Set([
                ...selectedEntries.map(entry => entry.projectId),
                ...selectedExpenses.map(expense => expense.projectId)
            ])
        ];

        const newInvoice = {
            id: `INV-${crypto.randomUUID()}`,
            createdAt: new Date().toISOString(),
            clientName: clientObj.name,
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: totalAmount,
            status: 'Draft',
            currency: currencySettings.default,
            items: [...timeInvoiceItems, ...expenseInvoiceItems],
            projectIds,
        };

        await addInvoice(newInvoice);

        // Mark entries as billed
        const billedEntryIds = new Set(selectedEntries.map(e => e.id));
        setTimeEntries(prevEntries =>
            prevEntries.map(entry =>
                billedEntryIds.has(entry.id) ? { ...entry, isBilled: true, invoiceId: newInvoice.id } : entry
            )
        );

        // Mark expenses as billed
        const billedExpenseIds = new Set(selectedExpenses.map(e => e.id));
        setExpenses(prevExpenses =>
            prevExpenses.map(expense =>
                billedExpenseIds.has(expense.id) ? { ...expense, isBilled: true, invoiceId: newInvoice.id } : expense
            )
        );

        showToast(`Invoice ${newInvoice.id} created!`);
        setIsBillableModalOpen(false);
    };

    const handleOpenBillableModal = () => {
        if (!selectedClient) return;

        const clientObj = clients.find(c => c.id === selectedClient);
        if (!clientObj) return;

        const clientProjects = projects.filter(p => p.clientId === clientObj.id);
        const clientProjectIds = clientProjects.map(p => p.id);

        const unbilledEntries = timeEntries.filter(entry =>
            clientProjectIds.includes(entry.projectId) && !entry.isBilled
        ).map(entry => {
            const project = projectMap[entry.projectId];
            return {
                ...entry,
                rate: project ? project.rate : 0,
            };
        });

        const unbilledExpenses = expenses.filter(expense =>
            clientProjectIds.includes(expense.projectId) && !expense.isBilled && expense.isBillable
        );

        setItemsToBill({ entries: unbilledEntries, expenses: unbilledExpenses });
        setIsBillableModalOpen(true);
        setIsNewInvoiceDialogOpen(false);
    };

    return (
        <>
            <Dialog isOpen={isNewInvoiceDialogOpen} onClose={() => setIsNewInvoiceDialogOpen(false)} title="Create New Invoice">
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="invoiceClient">Select Client</Label>
                        <Select id="invoiceClient" value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                            {activeClients.map(client => (
                                <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                        </Select>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">This will find all unbilled hours and expenses in the selected currency for this client.</p>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <Button type="button" variant="secondary" onClick={() => setIsNewInvoiceDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleOpenBillableModal}>Find Billable Items</Button>
                </div>
            </Dialog>

            <BillableItemsModal
                isOpen={isBillableModalOpen}
                onClose={() => setIsBillableModalOpen(false)}
                unbilledEntries={itemsToBill.entries}
                unbilledExpenses={itemsToBill.expenses}
                onCreateInvoice={(selectedEntries, selectedExpenses) => handleCreateInvoiceFromSelectedItems(selectedEntries, selectedExpenses, showToast)}
                currency={currencySettings.default}
            />
        </>
    );
};

export default NewInvoiceDialog;