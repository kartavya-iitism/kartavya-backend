const generateEmailTemplate = ({
    title,
    message,
    highlightBox = false,
    highlightContent,
    buttonLink,
    buttonText,
    additionalContent,
    logoUrl = 'https://divyanshgupta351.blob.core.windows.net/katavya-test-storage/logo.png'
}) => {
    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
            body {
                font-family: Arial, Helvetica, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #ffffff;
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
            }
            .header {
                background: #003366;
                color: #ffffff;
                padding: 20px;
                text-align: center;
            }
            .content {
                padding: 20px;
                background: #ffffff;
            }
            .highlight-box {
                background: #f0f0f0;
                border: 1px solid #cccccc;
                padding: 15px;
                margin: 20px 0;
                text-align: center;
            }
            .highlight-text {
                font-size: 24px;
                color: #003366;
                font-weight: bold;
            }
            .button {
                background: #003366;
                color: #ffffff;
                padding: 10px 20px;
                text-decoration: none;
                display: inline-block;
            }
            .footer {
                background: #f0f0f0;
                padding: 20px;
                text-align: center;
                color: #666666;
                border-top: 1px solid #cccccc;
            }
        </style>
    </head>
    <body>
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff">
            <tr>
                <td align="center">
                    <table class="container" cellpadding="0" cellspacing="0">
                        <tr>
                            <td class="header">
                                <img src="${logoUrl}" alt="Kartavya Foundation" width="120">
                                <h1>${title}</h1>
                            </td>
                        </tr>
                        <tr>
                            <td class="content">
                                <p>${message}</p>
                                ${highlightBox ? `
                                <div class="highlight-box">
                                    <div class="highlight-text">${highlightContent}</div>
                                </div>
                                ` : ''}
                                ${buttonLink ? `
                                <div style="text-align: center; margin: 20px 0;">
                                    <a href="${buttonLink}" class="button">${buttonText}</a>
                                </div>
                                ` : ''}
                                ${additionalContent || ''}
                            </td>
                        </tr>
                        <tr>
                            <td class="footer">
                                <p>&copy; ${new Date().getFullYear()} Kartavya Foundation</p>
                                <p>Contact: sponsor.kartavya@gmail.com</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;
};

module.exports = generateEmailTemplate;