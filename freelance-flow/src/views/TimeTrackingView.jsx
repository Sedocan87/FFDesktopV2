import React, { useState, useMemo, useEffect } from 'react';
import useStore from '../store';
import Button from '../components/Button';
import Card from '../components/Card';
import Dialog from '../components/Dialog';
import Input from '../components/Input';
import Label from '../components/Label';
import Select from '../components/Select';
import Textarea from '../components/Textarea';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { EditIcon, TrashIcon } from '../components/icons';

const TimeTrackingView = ({ showToast }) => {
    const { projects, timeEntries, addTimeEntry, updateTimeEntry, deleteTimeEntry,
        isTimerRunning, setIsTimerRunning, timerStartTime, setTimerStartTime,
        elapsedTime, setElapsedTime, timerProjectId, setTimerProjectId
    } = useStore();
    const [selectedProject, setSelectedProject] = useState('');
    const activeProjects = useMemo(() => projects.filter(p => !p.isArchived), [projects]);

    const [hours, setHours] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [entryToDelete, setEntryToDelete] = useState(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [editFormState, setEditFormState] = useState({
        project_id: '',
        hours: '',
        date: '',
        description: '',
    });

    const openEditDialog = (entry) => {
        setEditingEntry(entry);
        setEditFormState({
            project_id: entry.projectId,
            hours: entry.hours,
            date: new Date(entry.startTime).toISOString().split('T')[0],
            description: entry.description || '',
        });
        setIsEditDialogOpen(true);
    };

    const closeEditDialog = () => {
        setEditingEntry(null);
        setIsEditDialogOpen(false);
    };

    const handleUpdateEntry = async (e) => {
        e.preventDefault();
        if (!editingEntry) return;

        const hoursNum = parseFloat(editFormState.hours);
        if (isNaN(hoursNum) || hoursNum <= 0) {
            showToast("Invalid hours.");
            return;
        }

        const startDate = new Date(editFormState.date);
        const startTime = startDate.toISOString();
        const endTime = new Date(startDate.getTime() + hoursNum * 3600000).toISOString();

        await updateTimeEntry(
            editingEntry.id,
            editFormState.project_id,
            startTime,
            endTime,
            hoursNum,
            editFormState.description
        );

        showToast("Time entry updated successfully!");
        closeEditDialog();
    };

    const handleDeleteEntry = async () => {
        if (!entryToDelete) return;
        await deleteTimeEntry(entryToDelete.id);
        showToast("Time entry deleted.");
        setEntryToDelete(null);
    };

    const handleStartTimer = () => {
        if (!timerProjectId) {
            showToast("Please select a project to track.");
            return;
        }
        const project = activeProjects.find(p => p.id === timerProjectId);
        if (!project) {
            showToast("The selected project could not be found.");
            return;
        }
        setIsTimerRunning(true);
        setTimerStartTime(Date.now());
        setElapsedTime(0);
    };

    const handleStopTimer = async () => {
        if (!timerProjectId) {
            showToast("No project was selected for this timer.");
            setIsTimerRunning(false);
            return;
        }
        const project = activeProjects.find(p => p.id === timerProjectId);
        if (!project) {
            showToast("The project for this timer could not be found.");
            setIsTimerRunning(false);
            return;
        }

        setIsTimerRunning(false);
        const startTime = new Date(timerStartTime).toISOString();
        const endTime = new Date().toISOString();
        const hours = elapsedTime / 3600;
        const description = `Timer entry for ${project.name}`;
        await addTimeEntry({
            projectId: timerProjectId,
            startTime,
            endTime,
            hours,
            description,
            createdAt: new Date().toISOString(),
            isBilled: false
        });

        setTimerStartTime(null);
        setElapsedTime(0);
        setTimerProjectId(null);
        showToast(`Timer stopped at ${formatTime(elapsedTime)}.`);
    };

    const handleAddTimeEntry = async (e) => {
        e.preventDefault();
        const hoursNum = parseFloat(hours);
        if (!selectedProject || !hours || isNaN(hoursNum) || hoursNum <= 0) {
            showToast("Invalid time entry.");
            return;
        }
        const startDate = new Date(date);
        const startTime = startDate.toISOString();
        const endTime = new Date(startDate.getTime() + hoursNum * 3600000).toISOString();

        await addTimeEntry({
            projectId: selectedProject,
            startTime,
            endTime,
            hours: hoursNum,
            description,
            createdAt: new Date().toISOString(),
            isBilled: false
        });
        setHours('');
        setDescription('');
        showToast("Time entry logged successfully!");
    };

    const projectMap = useMemo(() => {
        return projects.reduce((acc, proj) => {
            acc[proj.id] = proj.name;
            return acc;
        }, {});
    }, [projects]);

    const activeTimeEntries = useMemo(() => timeEntries.filter(entry => !entry.isArchived).sort((a, b) => new Date(b.startTime) - new Date(a.startTime)), [timeEntries]);
    const paginatedEntries = usePagination(activeTimeEntries, 10);

    useEffect(() => {
        if (activeProjects.length > 0 && !selectedProject) {
            setSelectedProject(activeProjects[0].id);
        }
    }, [activeProjects, selectedProject]);

    const timerProjectName = useMemo(() => projectMap[timerProjectId] || 'Unknown Project', [projectMap, timerProjectId]);


    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Time Tracking</h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">Log your work hours or use the real-time tracker.</p>

            <Card className="my-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="flex-1 min-w-[200px]">
                         <Label htmlFor="timerProject">Track Project</Label>
                         <Select id="timerProject" value={timerProjectId || ''} onChange={(e) => setTimerProjectId(e.target.value)} disabled={isTimerRunning}>
                            {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </Select>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{isTimerRunning ? `Tracking: ${timerProjectName}` : 'Timer is stopped'}</p>
                        <p className="text-4xl font-bold font-mono text-slate-800 dark:text-white">{formatTime(elapsedTime)}</p>
                    </div>
                    <div>
                        {isTimerRunning ? (
                            <Button variant="destructive" onClick={handleStopTimer} className="w-32">Stop Timer</Button>
                        ) : (
                            <Button onClick={handleStartTimer} className="w-32">Start Timer</Button>
                        )}
                    </div>
                </div>
            </Card>

<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Log Time Manually</h3>
                        <form onSubmit={handleAddTimeEntry} className="space-y-4">
                             <div>
                                <Label htmlFor="logProject">Project</Label>
                                <Select id="logProject" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                                    {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="hours">Hours</Label>
                                <Input id="hours" type="number" step="0.01" value={hours} onChange={e => setHours(e.target.value)} required />
                            </div>
                             <div>
                                <Label htmlFor="date">Date</Label>
                                <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                            </div>
                             <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} />
                            </div>
                            <Button type="submit" className="w-full">Log Time</Button>
                        </form>
                    </Card>
                </div>
                 <div className="lg:col-span-2">
                     <Card className="overflow-x-auto">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Recent Entries</h3>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b dark:border-slate-800">
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Project</th>
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Hours</th>
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Date</th>
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Description</th>
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-slate-800">
                                {paginatedEntries.currentData.map(entry => (
                                    <tr key={entry.id}>
                                        <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{projectMap[entry.projectId]}</td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400 text-right font-mono">{(entry.hours || 0).toFixed(2)}</td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400">{new Date(entry.startTime).toLocaleDateString()}</td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400">{entry.description}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" className="px-2" onClick={() => openEditDialog(entry)}>
                                                    <EditIcon className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" className="px-2" onClick={() => setEntryToDelete(entry)}>
                                                    <TrashIcon className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <Pagination
                            currentPage={paginatedEntries.currentPage}
                            maxPage={paginatedEntries.maxPage}
                            goToPage={paginatedEntries.goToPage}
                            nextPage={paginatedEntries.nextPage}
                            prevPage={paginatedEntries.prevPage}
                        />
                    </Card>
                </div>
            </div>

            <Dialog isOpen={isEditDialogOpen} onClose={closeEditDialog} title="Edit Time Entry">
                <form onSubmit={handleUpdateEntry} className="space-y-4">
                    <div>
                        <Label htmlFor="editProject">Project</Label>
                        <Select id="editProject" value={editFormState.project_id} onChange={e => setEditFormState({...editFormState, project_id: e.target.value})}>
                            {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="editHours">Hours</Label>
                        <Input id="editHours" type="number" step="0.01" value={editFormState.hours} onChange={e => setEditFormState({...editFormState, hours: e.target.value})} required />
                    </div>
                    <div>
                        <Label htmlFor="editDate">Date</Label>
                        <Input id="editDate" type="date" value={editFormState.date} onChange={e => setEditFormState({...editFormState, date: e.target.value})} required />
                    </div>
                    <div>
                        <Label htmlFor="editDescription">Description</Label>
                        <Textarea id="editDescription" value={editFormState.description} onChange={e => setEditFormState({...editFormState, description: e.target.value})} />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={closeEditDialog}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </Dialog>

            <Dialog isOpen={!!entryToDelete} onClose={() => setEntryToDelete(null)} title="Delete Time Entry">
                <p>Are you sure you want to delete this time entry? This action cannot be undone.</p>
                <div className="flex justify-end gap-4 mt-6">
                    <Button variant="secondary" onClick={() => setEntryToDelete(null)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteEntry}>Delete</Button>
                </div>
            </Dialog>
        </div>
    );
};

export default TimeTrackingView;