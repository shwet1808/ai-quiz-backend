import pdfParse from 'pdf-parse';

/**
 * Extract text content from PDF buffer
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<string>} Extracted text
 */
export async function extractTextFromPDF(buffer) {
    try {
        const data = await pdfParse(buffer);

        // Clean up the text
        let text = data.text;

        // Remove excessive whitespace
        text = text.replace(/\s+/g, ' ').trim();

        // Remove page numbers and headers/footers (basic cleanup)
        text = text.replace(/Page \d+ of \d+/gi, '');

        return text;
    } catch (error) {
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
}

/**
 * Validate PDF content
 * @param {string} text - Extracted text
 * @returns {boolean} Whether text is valid for quiz generation
 */
export function validatePDFContent(text) {
    // Check if text has sufficient content
    const minLength = 100;
    const wordCount = text.split(/\s+/).length;

    if (text.length < minLength || wordCount < 20) {
        return false;
    }

    return true;
}
