import React, { useState } from 'react';
import useStore from '../store';
import Button from '../components/Button';
import Card from '../components/Card';
import Dialog from '../components/Dialog';
import Input from '../components/Input';
import Label from '../components/Label';
import EditIcon from '../components/icons/EditIcon';
import TrashIcon from '../components/icons/TrashIcon';

const ClientsView = ({ showToast, clientProjectCounts }) => {
    const { clients, addClient, updateClient, deleteClient } = useStore();
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

    const handleSaveClient = async (e) => {
        e.preventDefault();
        if (formName.trim() && formEmail.trim()) {
            if (editingClient) {
                await updateClient(editingClient.id, formName, formEmail);
                showToast("Client updated successfully!");
            } else {
                await addClient(formName, formEmail);
                showToast("Client added successfully!");
            }
            closeDialog();
        }
    };

    const handleDeleteClient = async () => {
        if (clientToDelete) {
            await deleteClient(clientToDelete.id);
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

export default ClientsView;