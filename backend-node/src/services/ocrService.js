const Tesseract = require('tesseract.js');

/**
 * Extracts text/voltages from dial/screen images.
 * @param {string} imagePath 
 */
async function extractVoltageFromImage(imagePath) {
  try {
    const { data: { text } } = await Tesseract.recognize(
      imagePath,
      'eng',
      { logger: m => console.log(m) }
    );
    
    // Simple extraction logic placeholder
    const voltMatch = text.match(/(\d+(\.\d+)?)\s*V/i);
    const voltage = voltMatch ? parseFloat(voltMatch[1]) : null;

    return {
      text,
      voltage,
      success: true
    };
  } catch (error) {
    console.error('OCR Processing Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  extractVoltageFromImage
};
