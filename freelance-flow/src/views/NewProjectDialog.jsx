import React, { useState, useEffect } from 'react';
import useStore from '../store';
import Button from '../components/Button';
import Dialog from '../components/Dialog';
import Input from '../components/Input';
import Label from '../components/Label';
import Select from '../components/Select';

const NewProjectDialog = ({ showToast }) => {
    const { clients, addProject, updateProject, isNewProjectDialogOpen, setIsNewProjectDialogOpen, editingProject, setEditingProject } = useStore();

    const [formState, setFormState] = useState({
        name: '',
        clientId: clients.length > 0 ? clients[0].id : '',
        rate: 100,
    });

    useEffect(() => {
        if (editingProject) {
            setFormState({
                name: editingProject.name,
                clientId: editingProject.clientId,
                rate: editingProject.rate || 100,
            });
        } else {
            setFormState({
                name: '',
                clientId: clients.length > 0 ? clients[0].id : '',
                rate: 100,
            });
        }
    }, [editingProject, clients]);

    const closeDialog = () => {
        setIsNewProjectDialogOpen(false);
        setEditingProject(null);
    };

    const handleFormChange = (e) => {
        const { id, value } = e.target;
        setFormState(prev => ({...prev, [id]: value}));
    };

    const handleSaveProject = async (e) => {
        e.preventDefault();
        if (formState.name.trim() && formState.clientId) {
            if (editingProject) {
                await updateProject(editingProject.id, formState.name, formState.clientId, parseFloat(formState.rate));
                showToast("Project updated successfully!");
            } else {
                await addProject(formState.name, formState.clientId, parseFloat(formState.rate));
                showToast("Project created successfully!");
            }
            closeDialog();
        }
    };

    return (
        <Dialog isOpen={isNewProjectDialogOpen} onClose={closeDialog} title={editingProject ? "Edit Project" : "Create New Project"}>
            <form onSubmit={handleSaveProject} className="space-y-4">
                <div>
                    <Label htmlFor="name">Project Name</Label>
                    <Input id="name" type="text" value={formState.name} onChange={handleFormChange} required />
                </div>
                <div>
                   <Label htmlFor="clientId">Client</Label>
                   <Select id="clientId" value={formState.clientId} onChange={handleFormChange}>
                       {clients.map(client => (
                           <option key={client.id} value={client.id}>{client.name}</option>
                       ))}
                   </Select>
               </div>
               <div>
                    <Label htmlFor="rate">Hourly Rate</Label>
                    <Input id="rate" type="number" value={formState.rate} onChange={handleFormChange} />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="secondary" onClick={closeDialog}>Cancel</Button>
                    <Button type="submit">{editingProject ? "Save Changes" : "Create Project"}</Button>
                </div>
            </form>
        </Dialog>
    );
};

export default NewProjectDialog;