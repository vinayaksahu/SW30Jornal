export interface ExtractedTradeData {
  symbol?: string;
  direction?: 'BUY' | 'SELL';
  volume?: number;
  entryPrice?: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  profitLoss?: number;
  commission?: number;
  swap?: number;
  entryTime?: string; // ISO string
  exitTime?: string;
  ticketNumber?: string;
  confidence: Record<string, number>;
  uncertainFields: string[];
  rawText?: string;
}

export interface OCRProvider {
  extract(imageBuffer: Buffer, mimeType: string): Promise<ExtractedTradeData>;
}

export class GoogleVisionOCRProvider implements OCRProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async extract(imageBuffer: Buffer, mimeType: string): Promise<ExtractedTradeData> {
    try {
      const base64Image = imageBuffer.toString('base64');
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [
              {
                image: { content: base64Image },
                features: [{ type: 'TEXT_DETECTION' }],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Google Vision API error: ${response.statusText}`);
      }

      const data = await response.json();
      const rawText =
        data.responses?.[0]?.textAnnotations?.[0]?.description ||
        data.responses?.[0]?.fullTextAnnotation?.text ||
        '';

      return LocalPatternOCRProvider.parseText(rawText);
    } catch (error) {
      console.error('Google Vision REST API Error:', error);
      return LocalPatternOCRProvider.parseText('');
    }
  }
}

export class LocalPatternOCRProvider implements OCRProvider {
  async extract(imageBuffer: Buffer, mimeType: string): Promise<ExtractedTradeData> {
    // When no external OCR key is present, parse available text or return template
    return LocalPatternOCRProvider.parseText('');
  }

  static parseText(rawText: string): ExtractedTradeData {
    const data: Partial<ExtractedTradeData> = {
      confidence: {},
      uncertainFields: [],
      rawText: rawText || '',
    };

    if (!rawText || rawText.trim().length === 0) {
      const allFields = [
        'symbol',
        'direction',
        'volume',
        'entryPrice',
        'exitPrice',
        'stopLoss',
        'takeProfit',
        'profitLoss',
        'commission',
        'swap',
        'entryTime',
        'exitTime',
        'ticketNumber',
      ];
      return {
        confidence: {},
        uncertainFields: allFields,
        rawText: '',
      };
    }

    const cleanText = rawText.replace(/\r/g, ' ');

    // 1. Ticket Number (8-10 digit integer)
    const ticketMatch = cleanText.match(/(?:#|Ticket[:\s]*)?([1-9]\d{7,10})\b/i);
    if (ticketMatch) {
      data.ticketNumber = ticketMatch[1];
      data.confidence!.ticketNumber = 0.95;
    }

    // 2. Symbol detection (e.g., XAUUSD, EURUSD, GBPUSD, NAS100, US30, BTCUSD)
    const symbolMatch = cleanText.match(
      /\b(XAUUSD|EURUSD|GBPUSD|USDJPY|USDCAD|AUDUSD|NZDUSD|USDCHF|EURGBP|EURJPY|GBPJPY|NAS100|US30|SPX500|GER40|UK100|BTCUSD|ETHUSD|[A-Z]{6,7})\b/i
    );
    if (symbolMatch) {
      data.symbol = symbolMatch[1].toUpperCase();
      data.confidence!.symbol = 0.95;
    }

    // 3. Direction (buy / sell)
    const directionMatch = cleanText.match(/\b(buy|sell)\b/i);
    if (directionMatch) {
      data.direction = directionMatch[1].toUpperCase() as 'BUY' | 'SELL';
      data.confidence!.direction = 0.95;
    }

    // 4. Volume / Lot size (e.g. 0.01, 0.10, 1.00, 5.00)
    const volumeMatch = cleanText.match(/(?:(?:buy|sell)[\s,]+|\bvol(?:ume)?[:\s]*)(\d+(?:\.\d{1,2})?)\b/i) ||
      cleanText.match(/\b(\d+\.\d{2})\b/);
    if (volumeMatch) {
      const vol = parseFloat(volumeMatch[1]);
      if (vol > 0 && vol <= 500) {
        data.volume = vol;
        data.confidence!.volume = 0.85;
      }
    }

    // 5. Timestamps (Format: YYYY.MM.DD HH:MM:SS or YYYY-MM-DD HH:MM:SS)
    const timeRegex = /\b(\d{4}[.-]\d{2}[.-]\d{2}\s+\d{2}:\d{2}(?::\d{2})?)\b/g;
    const timeMatches = Array.from(cleanText.matchAll(timeRegex)).map((m) => m[1]);
    if (timeMatches.length > 0) {
      try {
        const iso1 = new Date(timeMatches[0].replace(/\./g, '-')).toISOString();
        data.entryTime = iso1;
        data.confidence!.entryTime = 0.9;
        if (timeMatches.length > 1) {
          const iso2 = new Date(timeMatches[1].replace(/\./g, '-')).toISOString();
          data.exitTime = iso2;
          data.confidence!.exitTime = 0.9;
        }
      } catch {
        // invalid date parse
      }
    }

    // 6. Prices (Entry, Exit, SL, TP, Profit)
    // Extract decimal numbers
    const decimalNumbers = Array.from(cleanText.matchAll(/([+-]?\d+\.\d{2,5})/g)).map((m) =>
      parseFloat(m[1])
    );

    // If we have numbers, attempt intelligent slotting
    if (decimalNumbers.length > 0) {
      // Find possible profit/loss (often has +/- or is at the end)
      const plMatch = cleanText.match(/(?:profit|p\/l|gain|loss)[:\s]*([+-]?\d+\.\d{2})/i) ||
        cleanText.match(/([+-]\d+\.\d{2})\b/);
      if (plMatch) {
        data.profitLoss = parseFloat(plMatch[1]);
        data.confidence!.profitLoss = 0.9;
      }

      // Entry price
      if (decimalNumbers.length >= 1 && !data.entryPrice) {
        data.entryPrice = decimalNumbers[0];
        data.confidence!.entryPrice = 0.8;
      }
      if (decimalNumbers.length >= 2 && !data.exitPrice) {
        data.exitPrice = decimalNumbers[1];
        data.confidence!.exitPrice = 0.75;
      }
    }

    // 7. Commission and Swap
    const commMatch = cleanText.match(/commission[:\s]*([+-]?\d+\.\d{2})/i);
    if (commMatch) {
      data.commission = Math.abs(parseFloat(commMatch[1]));
      data.confidence!.commission = 0.9;
    } else {
      data.commission = 0;
      data.confidence!.commission = 0.8;
    }

    const swapMatch = cleanText.match(/swap[:\s]*([+-]?\d+\.\d{2})/i);
    if (swapMatch) {
      data.swap = parseFloat(swapMatch[1]);
      data.confidence!.swap = 0.9;
    } else {
      data.swap = 0;
      data.confidence!.swap = 0.8;
    }

    // Compute Uncertain Fields
    const fieldsToCheck: (keyof ExtractedTradeData)[] = [
      'symbol',
      'direction',
      'volume',
      'entryPrice',
      'exitPrice',
      'stopLoss',
      'takeProfit',
      'profitLoss',
      'entryTime',
      'ticketNumber',
    ];

    fieldsToCheck.forEach((f) => {
      const conf = data.confidence?.[f as string] || 0;
      if (conf < 0.7 || (data as any)[f] === undefined) {
        data.uncertainFields!.push(f as string);
      }
    });

    return data as ExtractedTradeData;
  }
}

export class OCRService {
  private provider: OCRProvider;

  constructor() {
    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY || process.env.OCR_API_KEY;
    if (apiKey) {
      this.provider = new GoogleVisionOCRProvider(apiKey);
    } else {
      this.provider = new LocalPatternOCRProvider();
    }
  }

  setProvider(provider: OCRProvider) {
    this.provider = provider;
  }

  async extract(imageBuffer: Buffer, mimeType: string): Promise<ExtractedTradeData> {
    return this.provider.extract(imageBuffer, mimeType);
  }
}

export const ocrService = new OCRService();
