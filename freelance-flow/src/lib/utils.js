export const CURRENCIES = [
    { code: 'USD', name: 'US Dollar', symbol: '$', symbolPosition: 'before' },
    { code: 'EUR', name: 'Euro', symbol: '€', symbolPosition: 'after' },
    { code: 'GBP', name: 'British Pound', symbol: '£', symbolPosition: 'before' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', symbolPosition: 'before' },
    { code: 'AUD', name: 'Australian Dollar', symbol: '$', symbolPosition: 'before' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: '$', symbolPosition: 'before' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', symbolPosition: 'before' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', symbolPosition: 'before' },
];

export const formatCurrency = (amount, currencyCode = 'USD') => {
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
        }).format(amount);
    } catch (e) {
        // Fallback for invalid currency codes
        const currency = CURRENCIES.find(c => c.code === currencyCode);
        return `${currency ? currency.symbol : '$'}${amount.toFixed(2)}`;
    }
};