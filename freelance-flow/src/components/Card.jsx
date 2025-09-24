import React from 'react';

const Card = ({ children, className = '', ...props }) => (
    <div {...props} className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 ${className}`}>
        {children}
    </div>
);

export default Card;