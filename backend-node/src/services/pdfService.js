const PDFDocument = require('pdfkit');
const fs = require('fs');

/**
 * Generates a PDF report for a given work order.
 * @param {number|string} workOrderId 
 * @param {string} outputPath 
 */
function generatePdfReport(workOrderId, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(outputPath);

    doc.pipe(writeStream);

    // Title
    doc.fontSize(25).text(`Work Order Report #${workOrderId}`, 100, 100);
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, 100, 150);
    
    // Simple placeholder structure
    doc.text('This is a boilerplate PDF report generated entirely via Node.js.', 100, 200);

    doc.end();

    writeStream.on('finish', () => {
      resolve(outputPath);
    });

    writeStream.on('error', (err) => {
      reject(err);
    });
  });
}

module.exports = {
  generatePdfReport
};
