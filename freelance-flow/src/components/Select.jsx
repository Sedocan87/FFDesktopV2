import React from 'react';

const Select = ({ children, className = '', ...props }) => (
    <select
        className={`w-full h-10 px-3 py-2 bg-transparent border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 appearance-none bg-no-repeat bg-right pr-8 ${className}`}
        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
        {...props}
    >
        {children}
    </select>
);

export default Select;