const puppeteer = require('puppeteer');
const generateReceiptHTML = require('./generateReceiptHTML.js');

const generateReceiptPDF = async (donation) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    const html = generateReceiptHTML(donation);

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
        width: '12.5in',
        height: '9.38in',
        printBackground: true,
        margin: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }
    });

    await browser.close();

    return pdfBuffer;
};

module.exports = generateReceiptPDF;
