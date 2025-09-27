import React, { useState, useEffect } from 'react';
import useStore from '../store';
import Button from '../components/Button';
import Dialog from '../components/Dialog';
import Input from '../components/Input';
import Label from '../components/Label';
import Select from '../components/Select';
import Textarea from '../components/Textarea';

const LogTimeDialog = ({ showToast }) => {
    const { projects, addTimeEntry, isLogTimeDialogOpen, setIsLogTimeDialogOpen } = useStore();
    const [selectedProject, setSelectedProject] = useState(projects.length > 0 ? projects[0].id : '');
    const [hours, setHours] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (projects.length > 0) {
            setSelectedProject(projects[0].id);
        }
    }, [projects]);

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
            isBilled: false
        });
        setHours('');
        setDescription('');
        showToast("Time entry logged successfully!");
        setIsLogTimeDialogOpen(false);
    };

    return (
        <Dialog isOpen={isLogTimeDialogOpen} onClose={() => setIsLogTimeDialogOpen(false)} title="Log Time">
            <form onSubmit={handleAddTimeEntry} className="space-y-4">
                 <div>
                    <Label htmlFor="logProject">Project</Label>
                    <Select id="logProject" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="secondary" onClick={() => setIsLogTimeDialogOpen(false)}>Cancel</Button>
                    <Button type="submit">Log Time</Button>
                </div>
            </form>
        </Dialog>
    );
};

export default LogTimeDialog;