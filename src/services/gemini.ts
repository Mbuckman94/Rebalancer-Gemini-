import { GoogleGenAI, Type } from "@google/genai";
import { Position } from "@/types";
import { classifyPositionFallback } from "./classification-fallback";

const MODEL_NAME = "gemini-2.5-flash-latest";

const SYSTEM_INSTRUCTION = `
You are a senior financial analyst with deep expertise in asset classification. 
Your task is to analyze a list of financial assets (tickers and descriptions) and classify them with high precision.

For each asset, determine:
1. Asset Class: Must be one of ["US_EQUITY", "NON_US_EQUITY", "FIXED_INCOME", "MUNI_BOND", "OTHER", "CASH"].
2. Sector: The specific industry sector (e.g., "Technology", "Healthcare", "Municipal", "Corporate Bond").
3. State Code: For Municipal Bonds ONLY, extract the 2-letter US state code (e.g., "NY", "CA") from the description. If not applicable, return null.
4. Logo Ticker: For Corporate Bonds, identify the ticker symbol of the parent issuer company to be used for logo display. For example, if the bond is "APPLE INC 3.5% 2030", return "AAPL". If not applicable, return null.

Return the result as a JSON array of objects, where each object corresponds to an input asset.
`;

const RESPONSE_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      symbol: { type: Type.STRING, description: "The input ticker symbol" },
      assetClass: { 
        type: Type.STRING, 
        enum: ["US_EQUITY", "NON_US_EQUITY", "FIXED_INCOME", "MUNI_BOND", "OTHER", "CASH"],
        description: "The classified asset class"
      },
      sector: { type: Type.STRING, description: "The industry sector" },
      stateCode: { type: Type.STRING, description: "2-letter state code for Munis, or null", nullable: true },
      logoTicker: { type: Type.STRING, description: "Parent ticker for Corp Bonds, or null", nullable: true }
    },
    required: ["symbol", "assetClass", "sector"]
  }
};

export async function scanPortfolio(positions: Position[], apiKey: string): Promise<Partial<Position>[]> {
  if (!apiKey) {
    console.warn("No Gemini API key provided, using fallback.");
    return positions.map(p => ({ ...p, ...classifyPositionFallback(p) }));
  }

  const ai = new GoogleGenAI({ apiKey });

  // Prepare input for the model
  const inputList = positions.map(p => ({
    symbol: p.symbol,
    description: p.description
  }));

  const prompt = `Classify the following assets:\n${JSON.stringify(inputList, null, 2)}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.1, // Low temperature for deterministic output
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("Empty response from Gemini");
    }

    const results = JSON.parse(jsonText) as any[];

    // Map results back to positions
    // We assume the order is preserved or match by symbol. 
    // Matching by symbol is safer.
    const resultMap = new Map(results.map((r: any) => [r.symbol, r]));

    return positions.map(p => {
      const aiResult = resultMap.get(p.symbol);
      if (aiResult) {
        return {
          id: p.id,
          assetClass: aiResult.assetClass,
          sector: aiResult.sector,
          stateCode: aiResult.stateCode || undefined,
          logoTicker: aiResult.logoTicker || undefined
        };
      } else {
        // Fallback for missing items
        return { ...p, ...classifyPositionFallback(p) };
      }
    });

  } catch (error) {
    console.error("Gemini AI Scan failed:", error);
    // Fallback to heuristics on error
    return positions.map(p => ({ ...p, ...classifyPositionFallback(p) }));
  }
}
