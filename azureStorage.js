const { BlobServiceClient } = require('@azure/storage-blob');
const path = require('path');
const { Readable } = require('stream');

// Environment variables
const AZURE_CONNECTION_STRING = process.env.AZURE_CONNECTION_STRING;
const AZURE_CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME;

if (!AZURE_CONNECTION_STRING || !AZURE_CONTAINER_NAME) {
    throw new Error('Azure Blob Storage configuration is incomplete.');
}

const uploadToAzureBlob = async (req, res, next) => {
    try {
        const userType = req.baseUrl.split('/')[1];
        const sanitizedUserType = userType.replace(/[^a-zA-Z0-9_-]/g, ''); // Sanitize user type
        if (!req.file) {
            if (sanitizedUserType === 'donation') {
                return res.status(400).json({ error: 'Please Upload Donation Reciept' });
            }
            req.fileUrl = null;
            req.blobName = null; // Store blob name for potential deletion
            req.containerClient = null; // Store container client for later access
            next();
        }
        else {
            if (!userType) {
                return res.status(400).json({ error: 'Invalid user type in URL.' });
            }

            // Initialize Blob Service Client using connection string
            const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
            const containerClient = blobServiceClient.getContainerClient(AZURE_CONTAINER_NAME);

            // Generate a blob name with a virtual directory

            const blobName = `${sanitizedUserType}/${Date.now()}-${path.basename(req.file.originalname)}`;
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);

            // Convert buffer to readable stream and upload to Azure
            const stream = Readable.from(req.file.buffer);
            await blockBlobClient.uploadStream(stream, req.file.size, undefined, {
                blobHTTPHeaders: { blobContentType: req.file.mimetype }
            });

            // Save file details in the request object
            req.fileUrl = blockBlobClient.url;
            req.blobName = blobName; // Store blob name for potential deletion
            req.containerClient = containerClient; // Store container client for later access

            next();
        }
    } catch (err) {
        console.error('Azure Blob Upload Error:', err);
        res.status(500).json({ error: 'File upload failed.', details: err.message });
    }
};

const deleteFromAzureBlob = async (blobUrl) => {
    try {
        if (!blobUrl) {
            throw new Error('No blob URL provided');
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
        const containerClient = blobServiceClient.getContainerClient(AZURE_CONTAINER_NAME);

        const blobName = blobUrl.split(`${AZURE_CONTAINER_NAME}/`)[1];
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        await blockBlobClient.delete();
        return true;
    } catch (error) {
        console.error('Azure Blob Delete Error:', error);
        throw error;
    }
};

module.exports = uploadToAzureBlob