const numberToWords = (num) => {
    const a = [
        '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
        'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen',
        'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];

    const b = [
        '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
        'Sixty', 'Seventy', 'Eighty', 'Ninety'
    ];

    const inWords = (n) => {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
        if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred ' + (n % 100 ? inWords(n % 100) : '');
        if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand ' + (n % 1000 ? inWords(n % 1000) : '');
        if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh ' + (n % 100000 ? inWords(n % 100000) : '');
        return inWords(Math.floor(n / 10000000)) + ' Crore ' + (n % 10000000 ? inWords(n % 10000000) : '');
    };

    if (num === 0) return 'Zero';

    return inWords(num).trim() + ' Only';
};

module.exports = numberToWords;