import React, { useEffect } from 'react';

const Toast = ({ message, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white py-3 px-5 rounded-lg shadow-lg animate-toast-in">
            {message}
        </div>
    );
};

export default Toast;