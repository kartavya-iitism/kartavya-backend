const { BlobServiceClient } = require('@azure/storage-blob');
const AZURE_CONNECTION_STRING = process.env.AZURE_CONNECTION_STRING;
const AZURE_CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME;

if (!AZURE_CONNECTION_STRING || !AZURE_CONTAINER_NAME) {
    throw new Error('Azure Blob Storage configuration is incomplete.');
}


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

module.exports = deleteFromAzureBlob