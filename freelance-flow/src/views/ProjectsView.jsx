import React, { useState, useMemo } from 'react';
import useStore from '../store';
import Button from '../components/Button';
import Card from '../components/Card';
import Dialog from '../components/Dialog';
import Input from '../components/Input';
import Label from '../components/Label';
import Select from '../components/Select';
import EditIcon from '../components/icons/EditIcon';
import TrashIcon from '../components/icons/TrashIcon';

const ProjectsView = ({ showToast }) => {
    const { projects, clients, timeEntries, addProject, updateProject, deleteProject } = useStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [projectToDelete, setProjectToDelete] = useState(null);

    const [formState, setFormState] = useState({
        name: '',
        clientId: clients.length > 0 ? clients[0].id : '',
        rate: 100,
    });

    const clientMap = useMemo(() => clients.reduce((acc, client) => {
        acc[client.id] = client.name;
        return acc;
    }, {}), [clients]);

    const projectHours = useMemo(() => timeEntries.reduce((acc, entry) => {
        if (entry.end_time) {
            const hours = (new Date(entry.end_time) - new Date(entry.start_time)) / 3600000;
            acc[entry.project_id] = (acc[entry.project_id] || 0) + hours;
        }
        return acc;
    }, {}), [timeEntries]);

    const openAddDialog = () => {
        setEditingProject(null);
        setFormState({
            name: '',
            clientId: clients.length > 0 ? clients[0].id : '',
            rate: 100,
        });
        setIsDialogOpen(true);
    };

    const openEditDialog = (project) => {
        setEditingProject(project);
        setFormState({
            name: project.name,
            clientId: project.client_id,
            rate: project.rate || 100,
        });
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
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
                await updateProject(editingProject.id, formState.name, parseInt(formState.clientId), parseFloat(formState.rate));
                showToast("Project updated successfully!");
            } else {
                await addProject(formState.name, parseInt(formState.clientId), parseFloat(formState.rate));
                showToast("Project created successfully!");
            }
            closeDialog();
        }
    };

    const handleDeleteProject = async () => {
        if (projectToDelete) {
            await deleteProject(projectToDelete.id);
            setProjectToDelete(null);
            showToast("Project deleted.");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Projects</h1>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">Manage your projects here.</p>
                </div>
                <Button onClick={openAddDialog}>Create New Project</Button>
            </div>

            <Card className="overflow-x-auto">
                <table className="w-full text-left">
                     <thead>
                        <tr className="border-b dark:border-slate-800">
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Project Name</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Client</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Hours Tracked</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                        {projects.map(project => (
                             <tr key={project.id}>
                                <td className="p-4 font-medium text-slate-900 dark:text-slate-300">
                                    {project.name}
                                </td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{clientMap[project.client_id]}</td>
                                <td className="p-4 text-slate-800 dark:text-slate-100 text-right font-mono">{(projectHours[project.id] || 0).toFixed(2)}</td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" className="px-2" onClick={() => openEditDialog(project)}>
                                            <EditIcon className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" className="px-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50" onClick={() => setProjectToDelete(project)}>
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            <Dialog isOpen={isDialogOpen} onClose={closeDialog} title={editingProject ? "Edit Project" : "Create New Project"}>
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

            <Dialog isOpen={!!projectToDelete} onClose={() => setProjectToDelete(null)} title="Delete Project">
                <p>Are you sure you want to delete the project "{projectToDelete?.name}"? This will not delete its associated time entries but may affect reporting.</p>
                 <div className="flex justify-end gap-4 mt-6">
                    <Button variant="secondary" onClick={() => setProjectToDelete(null)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteProject}>Delete</Button>
                </div>
            </Dialog>
        </div>
    );
};

export default ProjectsView;