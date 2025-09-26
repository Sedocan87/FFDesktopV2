import React, { useState } from 'react';
import useStore from '../store';
import Button from '../components/Button';
import Card from '../components/Card';
import Dialog from '../components/Dialog';
import { UnarchiveIcon, TrashIcon } from '../components/icons';

const ArchivedItemsView = ({ showToast }) => {
    const {
        clients,
        projects,
        invoices,
        timeEntries,
        expenses,
        unarchiveClient,
        deleteClient,
        unarchiveProject,
        deleteProject,
        unarchiveInvoice,
        deleteInvoice,
        unarchiveTimeEntry,
        deleteTimeEntry,
        unarchiveExpense,
        deleteExpense,
    } = useStore();

    const [itemToUnarchive, setItemToUnarchive] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [itemType, setItemType] = useState('');

    const openUnarchiveDialog = (item, type) => {
        setItemToUnarchive(item);
        setItemType(type);
    };

    const openDeleteDialog = (item, type) => {
        setItemToDelete(item);
        setItemType(type);
    };

    const closeDialogs = () => {
        setItemToUnarchive(null);
        setItemToDelete(null);
        setItemType('');
    };

    const handleUnarchive = async () => {
        if (!itemToUnarchive) return;

        switch (itemType) {
            case 'client':
                await unarchiveClient(itemToUnarchive.id);
                break;
            case 'project':
                await unarchiveProject(itemToUnarchive.id);
                break;
            case 'invoice':
                await unarchiveInvoice(itemToUnarchive.id);
                break;
            case 'timeEntry':
                await unarchiveTimeEntry(itemToUnarchive.id);
                break;
            case 'expense':
                await unarchiveExpense(itemToUnarchive.id);
                break;
            default:
                break;
        }

        showToast(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} unarchived.`);
        closeDialogs();
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;

        switch (itemType) {
            case 'client':
                await deleteClient(itemToDelete.id);
                break;
            case 'project':
                await deleteProject(itemToDelete.id);
                break;
            case 'invoice':
                await deleteInvoice(itemToDelete.id);
                break;
            case 'timeEntry':
                await deleteTimeEntry(itemToDelete.id);
                break;
            case 'expense':
                await deleteExpense(itemToDelete.id);
                break;
            default:
                break;
        }

        showToast(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} permanently deleted.`);
        closeDialogs();
    };

    const archivedClients = clients.filter(c => c.isArchived);
    const archivedProjects = projects.filter(p => p.isArchived);
    const archivedInvoices = invoices.filter(i => i.isArchived);
    const archivedTimeEntries = timeEntries.filter(t => t.isArchived);
    const archivedExpenses = expenses.filter(e => e.isArchived);

    const clientMap = clients.reduce((acc, client) => {
        acc[client.id] = client;
        return acc;
    }, {});

    const projectMap = projects.reduce((acc, project) => {
        acc[project.id] = project;
        return acc;
    }, {});

    const renderSection = (title, items, type) => {
        if (items.length === 0) return null;

        return (
            <Card>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">{title}</h3>
                <ul className="divide-y dark:divide-slate-800">
                    {items.map(item => {
                        let isUnarchiveDisabled = false;
                        if (type === 'project') {
                            const client = clientMap[item.clientId];
                            isUnarchiveDisabled = client && client.isArchived;
                        } else if (type === 'timeEntry' || type === 'expense') {
                            const project = projectMap[item.project_id || item.projectId];
                            isUnarchiveDisabled = project && project.isArchived;
                        }

                        return (
                            <li key={item.id} className="flex justify-between items-center p-2">
                                <span>{item.name || item.id}</span>
                                <div className="flex gap-2">
                                    <Button variant="ghost" className="px-2" onClick={() => openUnarchiveDialog(item, type)} disabled={isUnarchiveDisabled}>
                                        <UnarchiveIcon className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" className="px-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50" onClick={() => openDeleteDialog(item, type)}>
                                        <TrashIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </Card>
        );
    };

    return (
        <div className="space-y-8">
            {renderSection('Archived Clients', archivedClients, 'client')}
            {renderSection('Archived Projects', archivedProjects, 'project')}
            {renderSection('Archived Invoices', archivedInvoices, 'invoice')}
            {renderSection('Archived Time Entries', archivedTimeEntries, 'timeEntry')}
            {renderSection('Archived Expenses', archivedExpenses, 'expense')}

            <Dialog isOpen={!!itemToUnarchive} onClose={closeDialogs} title={`Unarchive ${itemType}`}>
                <p>Are you sure you want to unarchive this {itemType}?</p>
                <div className="flex justify-end gap-4 mt-6">
                    <Button variant="secondary" onClick={closeDialogs}>Cancel</Button>
                    <Button onClick={handleUnarchive}>Unarchive</Button>
                </div>
            </Dialog>

            <Dialog isOpen={!!itemToDelete} onClose={closeDialogs} title={`Delete ${itemType} Permanently`}>
                <p>Are you sure you want to permanently delete this {itemType}? This action cannot be undone.</p>
                <div className="flex justify-end gap-4 mt-6">
                    <Button variant="secondary" onClick={closeDialogs}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete}>Delete Permanently</Button>
                </div>
            </Dialog>
        </div>
    );
};

export default ArchivedItemsView;