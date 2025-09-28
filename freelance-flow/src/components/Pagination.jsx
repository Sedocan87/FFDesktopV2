import React from 'react';
import Button from './Button';

const Pagination = ({ currentPage, maxPage, goToPage, prevPage, nextPage }) => {
    const pageNumbers = [];
    for (let i = 1; i <= maxPage; i++) {
        pageNumbers.push(i);
    }

    if (maxPage <= 1) return null;

    return (
        <div className="flex justify-center items-center gap-2 mt-6">
            <Button onClick={prevPage} disabled={currentPage === 1} variant="secondary" className="px-3 py-1">
                Prev
            </Button>

            {pageNumbers.map(number => (
                <Button
                    key={number}
                    onClick={() => goToPage(number)}
                    variant={currentPage === number ? 'default' : 'secondary'}
                    className="px-3 py-1"
                >
                    {number}
                </Button>
            ))}

            <Button onClick={nextPage} disabled={currentPage === maxPage} variant="secondary" className="px-3 py-1">
                Next
            </Button>
        </div>
    );
};

export default Pagination;