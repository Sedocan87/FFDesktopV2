import React from 'react';

const UnarchiveIcon = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
        <rect x="1" y="3" width="22" height="5" />
        <line x1="12" y1="16" x2="12" y2="10" />
        <polyline points="15 13 12 10 9 13" />
    </svg>
);

export default UnarchiveIcon;