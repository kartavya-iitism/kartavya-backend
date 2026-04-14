const numberToWords = require('./numberToWords');
const fs = require('fs');
const path = require('path');
const LOGO = `data:image/jpeg;base64,${fs.readFileSync(path.join(__dirname, '../public/logo.jpeg'), 'base64')}`;
const SIGNATURE = `data:image/jpeg;base64,${fs.readFileSync(path.join(__dirname, '../public/Signature.jpeg'), 'base64')}`;

const generateReceiptHTML = (donation) => {
    const formattedDate = new Date(donation.donationDate).toLocaleDateString('en-GB');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8" />
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: "Times New Roman", Times, serif;
            }

            .receipt-container {
                width: 1050px;
                margin: 20px auto;
                padding: 30px 50px;
                background: white;
                font-family: "Times New Roman", Times, serif;
                box-sizing: border-box;
                font-size: 20px;
            }

            .receipt-header {
                display: grid;
                grid-template-columns: 1fr 2fr 1fr;
                align-items: center; /* Changed to center to align with big logo */
                margin-bottom: 5px;
            }

            .left-info, .right-info {
                font-size: 16px;
                line-height: 1.5;
            }

            .center-header {
                width: 400px;
                text-align: center;
            }

            .large-logo {
                height: 250px;
                width: 750px;
                padding-left: 100px;
                margin-bottom: 10px;
            }

            .receipt-title {
                text-align: center;
                font-size: 25px;
                font-weight: bold;
                margin: 15px 0;
                padding-top: 10px;
                border-top: 1px solid black;
            }

            .receipt-body {
                margin-top: 10px;
                font-size: 20px;
            }

            .meta-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
            }

            .field-row {
                margin: 12px 0;
                display: flex;
                align-items: baseline;
                border-bottom: 1px dotted #555;
                padding-bottom: 2px;
            }

            .field-row span {
                padding-left: 12px;
            }

            .amount-email-row {
                display: flex;
                gap: 30px; 
            }

            .flex-1 { flex: 1; }
            .flex-2 { flex: 2; }

            .no-border { border: none !important; }

            .signature-section {
                margin-top: 35px;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
            }

            .signature-section img {
                height: 65px;
                margin-right: 25px;
            }

            .signature-section p {
                border-top: 1px solid black;
                width: 180px;
                text-align: center;
                padding-top: 4px;
                font-size: 14px;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="receipt-container">

            <div class="receipt-header">
                <div class="left-info">
                    <p><strong>Regn. No. S/63750/2008</strong></p>
                    <p><strong>PAN No. AABTK9999H</strong></p>
                </div>

                <div class="center-header">
                    <img src="${LOGO}" class="large-logo" />
                </div>
            </div>

            <h2 class="receipt-title">DONATION / CONTRIBUTION RECEIPT</h2>

            <div class="receipt-body">

                <div class="meta-row">
                    <p class="no-border"><strong>Date -</strong> ${formattedDate}</p>
                    <p class="no-border"><strong>Receipt No - ${donation.receiptNumber}</strong></p>
                </div>

                <p class="field-row">
                    <strong>Received With Thanks From -</strong>
                    <span>${donation.name}</span>
                </p>

                <p class="field-row">
                    <strong>A Sum of Rupees (In Words) -</strong>
                    <span>${numberToWords(donation.amount)}</span>
                </p>

                <p class="field-row">
                    <strong>Internal Reference No.: </strong> <span>${donation._id}</span>
                </p>

                <div class="amount-email-row">
                    <p class="field-row flex-1">
                        <strong>Amount (In Figure) -</strong>
                        <span>₹${donation.amount}</span>
                    </p>

                    <p class="field-row flex-2">
                        <strong>Email -</strong>
                        <span>${donation.email}</span>
                    </p>
                </div>

                <p class="field-row">
                    <strong>As Donation/Sponsorship for -</strong>
                    <span>KARTAVYA ("Dhanbad Chapter")</span>
                </p>

            </div>

            <div class="signature-section">
                <img src="${SIGNATURE}" />
                <p>
                Praveen Kumar<br/>
                (Executive Director)
                </p>
            </div>

        </div>
    </body>
    </html>
    `;
};

module.exports = generateReceiptHTML;
