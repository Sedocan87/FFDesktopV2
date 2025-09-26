import React, { useState } from 'react';
import Button from './Button';
import { PlusIcon, XIcon } from './icons';

const FAB = ({ actions }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-8 right-8 z-50">
            <div className={`flex flex-col items-center space-y-4 ${isOpen ? 'block' : 'hidden'}`}>
                {actions.map((action, index) => (
                    <Button
                        key={index}
                        onClick={() => {
                            action.onClick();
                            setIsOpen(false);
                        }}
                        className="rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
                    >
                        {action.icon}
                    </Button>
                ))}
            </div>
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-full w-16 h-16 flex items-center justify-center shadow-xl mt-4"
            >
                {isOpen ? <XIcon className="w-6 h-6" /> : <PlusIcon className="w-6 h-6" />}
            </Button>
        </div>
    );
};

export default FAB;