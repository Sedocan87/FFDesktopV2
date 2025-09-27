import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { EditIcon, TrashIcon } from './icons';
import { MenuIcon } from './icons';

const KanbanCard = ({ task, setEditingTask, setIsTaskDialogOpen, deleteTask, projectId }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div 
            ref={setNodeRef}
            style={style}
            className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm"
        >
            <div className="flex justify-between items-start">
                <h4 className="font-medium text-slate-900 dark:text-slate-200">{task.title}</h4>
                <div className="flex gap-2">
                    <button {...listeners} {...attributes}><MenuIcon className="w-4 h-4 text-slate-500 cursor-grab" /></button>
                    <button onClick={() => { setEditingTask(task); setIsTaskDialogOpen(true); }}><EditIcon className="w-4 h-4 text-slate-500 hover:text-slate-700" /></button>
                    <button onClick={() => deleteTask(task.id)}><TrashIcon className="w-4 h-4 text-slate-500 hover:text-red-500" /></button>
                </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{task.description}</p>
        </div>
    );
};

export default KanbanCard;