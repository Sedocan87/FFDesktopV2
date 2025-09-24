import React from 'react';

const Label = ({ children, htmlFor, className = '' }) => (
    <label htmlFor={htmlFor} className={`block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ${className}`}>
        {children}
    </label>
);

export default Label;