import { useState, useMemo } from 'react';

export const usePagination = (data, itemsPerPage) => {
    const [currentPage, setCurrentPage] = useState(1);
    const maxPage = Math.ceil(data.length / itemsPerPage);

    const currentData = useMemo(() => {
        const begin = (currentPage - 1) * itemsPerPage;
        const end = begin + itemsPerPage;
        return data.slice(begin, end);
    }, [data, currentPage, itemsPerPage]);

    const nextPage = () => {
        setCurrentPage((page) => Math.min(page + 1, maxPage));
    };

    const prevPage = () => {
        setCurrentPage((page) => Math.max(page - 1, 1));
    };

    const goToPage = (pageNumber) => {
        const page = Math.max(1, Math.min(pageNumber, maxPage));
        setCurrentPage(page);
    }

    return {
        currentPage,
        maxPage,
        currentData,
        nextPage,
        prevPage,
        goToPage,
    };
};