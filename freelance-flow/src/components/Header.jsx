import React from 'react';
import { MenuIcon } from './icons/index';

const Header = ({ onMenuClick }) => (
    <header className="md:hidden sticky top-0 bg-white dark:bg-slate-900 border-b dark:border-slate-800 p-4 flex items-center justify-between z-20">
        <button onClick={onMenuClick}>
            <MenuIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-200">FreelanceFlow</h1>
        <div className="w-6"></div>
    </header>
);

export default Header;