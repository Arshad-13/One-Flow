/**
 * Helper to normalize OCR date formats (e.g. DD/MM/YYYY, MM/DD/YYYY, text dates) into YYYY-MM-DD.
 */
function normalizeOcrDate(dateStr) {
  if (!dateStr) return null;
  
  // Try standard JS date parsing first (handles ISO, "Month DD, YYYY", etc.)
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return d.toISOString().split('T')[0];
  }
  
  // Try custom regex patterns for formats like DD/MM/YYYY, MM/DD/YYYY, or YYYY/MM/DD
  const parts = dateStr.split(/[-\/.]/);
  if (parts.length === 3) {
    const part0 = parts[0].trim();
    const part1 = parts[1].trim();
    const part2 = parts[2].trim();
    
    // Check if part0 is a 4-digit year (YYYY/MM/DD)
    if (part0.length === 4) {
      const year = parseInt(part0, 10);
      const month = parseInt(part1, 10);
      const day = parseInt(part2, 10);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1000) {
        const pad = (n) => String(n).padStart(2, '0');
        return `${year}-${pad(month)}-${pad(day)}`;
      }
    } else {
      let day = parseInt(part0, 10);
      let month = parseInt(part1, 10);
      let year = parseInt(part2, 10);
      
      // Handle 2-digit years (assume 20xx)
      if (year < 100) {
        year += 2000;
      }
      
      // Resolve ambiguity between DD/MM/YYYY and MM/DD/YYYY
      if (month > 12 && day <= 12) {
        const temp = day;
        day = month;
        month = temp;
      }
      
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1000) {
        const pad = (n) => String(n).padStart(2, '0');
        return `${year}-${pad(month)}-${pad(day)}`;
      }
    }
  }
  
  return null;
}

/**
 * Parses raw text extracted from an invoice/receipt to extract structured fields.
 */
class ReceiptExtractor {
  constructor(text) {
    this.text = text || "";
    this.lines = this.text.split('\n');
    this.patterns = {
      amount: /(?:total|amount|due|balance)[\s:]*([\$€₹£]?\s*\d+[\.,]\d{2})/i,
      date: /(\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4})|(\w+\s\d{1,2},\s\d{4})/i,
      currency: /([\$€₹£]|USD|EUR|INR)/i,
    };
    this.categoryKeywords = {
      'Food & Dining': ['restaurant', 'cafe', 'food', 'grill', 'pizza', 'kitchen'],
      'Groceries': ['market', 'grocery', 'supermarket', 'mart'],
      'Travel': ['taxi', 'cab', 'uber', 'lyft', 'airlines', 'transit'],
    };
  }

  _findMatch(pattern) {
    const match = this.text.match(pattern);
    return match ? match[1] || match[0] : null;
  }

  extractAmount() {
    const keywordMatch = this._findMatch(this.patterns.amount);
    if (keywordMatch) {
      return keywordMatch.replace(/[^\d.,]/g, '').trim();
    }
    // Fallback: find the largest number with two decimal places
    const allNumbers = this.text.match(/\d+[\.,]\d{2}/g) || [];
    if (allNumbers.length > 0) {
      const numericValues = allNumbers.map(n => parseFloat(n.replace(',', '.')));
      return Math.max(...numericValues).toFixed(2);
    }
    return null;
  }

  extractDate() {
    const rawDate = this._findMatch(this.patterns.date);
    return normalizeOcrDate(rawDate);
  }

  extractCurrency() {
    return this._findMatch(this.patterns.currency);
  }

  extractCategory() {
    const textLower = this.text.toLowerCase();
    for (const category in this.categoryKeywords) {
      for (const keyword of this.categoryKeywords[category]) {
        if (textLower.includes(keyword)) {
          return category;
        }
      }
    }
    return 'General';
  }

  extractLineItems() {
    const items = [];
    const filterKeywords = ['total', 'subtotal', 'tax', 'cash', 'change', 'vat', 'gst', 'discount', 'payment', 'balance', 'card', 'visa', 'mastercard', 'invoice'];

    for (const line of this.lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      if (filterKeywords.some(keyword => trimmedLine.toLowerCase().includes(keyword))) {
        continue;
      }

      // Regex for structured line item: quantity, description/name, price (optionally with currency symbols, dots, commas)
      const lineItemRegex = /^(?:(\d+)\s*[xX]?\s+)?(.+?)\s+[\$€₹£]?\s*(\d+(?:[\.,]\d{1,2})?)$/;
      const match = trimmedLine.match(lineItemRegex);

      if (match) {
        const quantity = parseInt(match[1], 10) || 1;
        let itemName = match[2].trim();
        const priceStr = match[3];
        const price = parseFloat(priceStr.replace(',', '.'));

        // Clean up item name from leading/trailing punctuation or symbol fragments
        itemName = itemName.replace(/^[\$€₹£\s\-\*]+/, '').replace(/[\$€₹£\s\-\*]+$/, '').trim();

        if (itemName && !isNaN(price) && price > 0) {
          items.push({
            item_name: itemName,
            price: price,
            quantity: quantity,
          });
        }
      } else {
        // Fallback matching logic for simpler or noisy lines
        const fallbackRegex = /(.+?)\s+[\$€₹£]?\s*(\d+(?:[\.,]\d{1,2})?)$/;
        const fbMatch = trimmedLine.match(fallbackRegex);
        if (fbMatch) {
          let itemName = fbMatch[1].trim();
          const price = parseFloat(fbMatch[2].replace(',', '.'));
          itemName = itemName.replace(/^[\$€₹£\s\-\*]+/, '').replace(/[\$€₹£\s\-\*]+$/, '').trim();

          let quantity = 1;
          const qtyMatch = itemName.match(/^(\d+)\s*[xX]?\s+(.+)$/);
          if (qtyMatch) {
            quantity = parseInt(qtyMatch[1], 10) || 1;
            itemName = qtyMatch[2].trim();
          }

          if (itemName && !isNaN(price) && price > 0) {
            items.push({
              item_name: itemName,
              price: price,
              quantity: quantity,
            });
          }
        }
      }
    }
    return items;
  }

  getAll() {
    return {
      // snake_case (used by process-bill route API)
      total_amount: this.extractAmount(),
      transaction_date: this.extractDate(),
      currency: this.extractCurrency(),
      category: this.extractCategory(),
      line_items: this.extractLineItems(),
      // camelCase (kept for compatibility)
      amount: this.extractAmount(),
      date: this.extractDate(),
      lineItems: this.extractLineItems(),
    };
  }
}

/**
 * Calls the OCR.space API to extract text from an image file.
 * @param {File} file - The image file of the receipt.
 * @param {string} apiKey - Your OCR.space API key.
 * @returns {Promise<string|null>} The parsed text from the receipt or null on failure.
 */
async function getTextFromReceipt(file, apiKey) {
  if (!file) {
    console.error("No file provided.");
    return null;
  }

  const fileName = file.name || "";
  const fileType = file.type || "";
  const isGif = fileName.toLowerCase().endsWith('.gif') || fileType === 'image/gif';
  let ocrEngine = isGif ? "1" : "2";

  const makeOcrRequest = async (engine) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("isTable", "true");
    formData.append("OCREngine", engine);
    formData.append("language", "eng");

    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        "apikey": apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  try {
    let result = await makeOcrRequest(ocrEngine);

    const errorMessageString = result.ErrorMessage ? (Array.isArray(result.ErrorMessage) ? result.ErrorMessage.join(", ") : String(result.ErrorMessage)) : "";
    if (result.IsErroredOnProcessing && ocrEngine === "2" && 
        (errorMessageString.includes("Engine 2 has no GIF support") || errorMessageString.includes("GIF") || errorMessageString.includes("engine 2"))) {
      console.warn("OCR Space Engine 2 error, retrying with Engine 1:", errorMessageString);
      ocrEngine = "1";
      result = await makeOcrRequest(ocrEngine);
    }

    if (result.IsErroredOnProcessing) {
      console.error("OCR Error:", result.ErrorMessage); 
      return null;
    }

    return result.ParsedResults[0]?.ParsedText;

  } catch (error) {
    console.error("Failed to call OCR API:", error);
    return null;
  }
}

/**
 * Helper Function for API Call (Internal)
 */
async function getTextFromOcr(file, apiKey) {
  if (!file) {
    throw new Error("No file provided for OCR.");
  }

  const fileName = file.name || "";
  const fileType = file.type || "";
  const isGif = fileName.toLowerCase().endsWith('.gif') || fileType === 'image/gif';
  let ocrEngine = isGif ? "1" : "2";

  const makeOcrRequest = async (engine) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("isTable", "true");
    formData.append("OCREngine", engine);
    formData.append("language", "eng");

    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        "apikey": apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  try {
    let result = await makeOcrRequest(ocrEngine);

    const errorMessageString = result.ErrorMessage ? (Array.isArray(result.ErrorMessage) ? result.ErrorMessage.join(", ") : String(result.ErrorMessage)) : "";
    if (result.IsErroredOnProcessing && ocrEngine === "2" && 
        (errorMessageString.includes("Engine 2 has no GIF support") || errorMessageString.includes("GIF") || errorMessageString.includes("engine 2"))) {
      console.warn("OCR Space Engine 2 error, retrying with Engine 1:", errorMessageString);
      ocrEngine = "1";
      result = await makeOcrRequest(ocrEngine);
    }

    if (result.IsErroredOnProcessing) {
      const errStr = result.ErrorMessage ? (Array.isArray(result.ErrorMessage) ? result.ErrorMessage.join(", ") : String(result.ErrorMessage)) : "Unknown OCR Error";
      throw new Error(`OCR API Error: ${errStr}`);
    }
    
    const parsedText = result.ParsedResults?.[0]?.ParsedText;
    if (!parsedText) {
        throw new Error("OCR processing succeeded but returned no text.");
    }

    return parsedText;

  } catch (error) {
    throw new Error(`Failed to call OCR API: ${error.message}`);
  }
}

/**
 * Processes a receipt image file to extract structured data.
 *
 * @param {File} file - The image file of the receipt.
 * @param {string} apiKey - Your OCR.space API key.
 * @returns {Promise<object>} A promise that resolves to an object with the structured receipt data.
 */
export async function processReceipt(file, apiKey) {
  const rawText = await getTextFromOcr(file, apiKey);
  const extractor = new ReceiptExtractor(rawText);
  const receiptData = extractor.getAll();

  return receiptData;
}