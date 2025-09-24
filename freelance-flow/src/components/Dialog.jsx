import React from 'react';
import XIcon from './icons/XIcon';

const Dialog = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in"
          onClick={onClose}
        >
            <div
              className="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg m-4 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b dark:border-slate-800">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Dialog;