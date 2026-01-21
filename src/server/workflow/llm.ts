import { GoogleGenerativeAI } from "@google/generative-ai";

export async function runLLM(payload: { prompt: string; system?: string; images?: string[]; temperature?: number }) {
    const { prompt, system, images = [], temperature = 0.7 } = payload;
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
    
    // Validate inputs
    if (!prompt) throw new Error("Prompt is required");

    const executeWithModel = async (modelName: string) => {
        
        const model = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: { temperature } 
        });

        const parts: any[] = [];

        if (system) {
            parts.push({ text: `System Instruction: ${system}\n\n` });
        }

        if (images && images.length > 0) {
            const enhancedPrompt = `I'm providing ${images.length} image(s) for you to analyze.\n\nSilently examine what you see in each image, then: ${prompt}\n\nIMPORTANT: Do NOT include an "Image Analysis" section. Just provide the final requested output directly. Reference the visual content naturally in your response. Avoid using markdown formatting like **text** - use plain text only.`;
            parts.push({ text: enhancedPrompt });
        } else {
            parts.push({ text: prompt });
        }

        if (images && images.length > 0) {
            for (const imgUrl of images) {
                try {
                    if (imgUrl.startsWith('data:')) {
                        const match = imgUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
                        if (match) {
                            parts.push({
                                inlineData: { mimeType: match[1], data: match[2] }
                            });
                        }
                    } else {
                        // Assuming URL, fetch it
                        const response = await fetch(imgUrl);
                        const arrayBuffer = await response.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);
                        const base64 = buffer.toString('base64');
                        const mimeType = response.headers.get('content-type') || 'image/jpeg';
                        
                        parts.push({
                            inlineData: { mimeType, data: base64 }
                        });
                    }
                } 
                catch (e) {
                    console.error("LLM: Failed to process image:", imgUrl, e);
                }
            }
        }

        const result = await model.generateContent(parts);
        const response = await result.response;
        return response.text();
    };

    try {
        const output = await executeWithModel("gemini-2.0-flash-lite");
        return { text: output };
    } 
    catch (error: any) {
        console.warn("Primary model (gemini-2.0-flash-lite) failed, attempting fallback...", error.message);
        
        try {
            const output = await executeWithModel("gemini-2.5-flash");
            return { text: output };
        } 
        catch (fallbackError: any) {
             console.warn("Fallback 1 failed, attempting gemini-2.0-flash...", fallbackError.message);
             try {
                const output = await executeWithModel("gemini-2.0-flash");
                return { text: output };
             } 
             catch (finalError: any) {
                 console.error("All LLM models failed", finalError);
                 throw finalError;
             }
        }
    }
}
