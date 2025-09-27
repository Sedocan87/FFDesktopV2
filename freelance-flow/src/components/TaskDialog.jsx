import React, { useState, useEffect } from 'react';
import useStore from '../store';
import Button from './Button';
import Dialog from './Dialog';
import Input from './Input';
import Label from './Label';
import Textarea from './Textarea';
import Select from './Select';

const TaskDialog = ({ isOpen, onClose, task, projectId }) => {
    const { addTask, updateTask } = useStore();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('To Do');

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description);
            setStatus(task.status);
        } else {
            setTitle('');
            setDescription('');
            setStatus('To Do');
        }
    }, [task]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title) return;

        if (task) {
            await updateTask(projectId, task.id, { title, description, status });
        } else {
            await addTask(projectId, { title, description, status });
        }
        onClose();
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title={task ? 'Edit Task' : 'New Task'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div>
                    <Label htmlFor="status">Status</Label>
                    <Select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option>To Do</option>
                        <option>In Progress</option>
                        <option>Done</option>
                    </Select>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">{task ? 'Save' : 'Create'}</Button>
                </div>
            </form>
        </Dialog>
    );
};

export default TaskDialog;