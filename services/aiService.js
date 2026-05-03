// DeepSeek API flashcard generation service
// DeepSeek uses an OpenAI-compatible format
// https://api-docs.deepseek.com/
// https://www.sitepoint.com/deepseek-api-integration-with-react-and-nextjs/
// https://www.youtube.com/watch?v=iEg7MyXSrU0
// https://www.youtube.com/watch?v=FJJaOrYFzp4

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

/*
 Generates flashcards from study notes using the DeepSeek API
 Prompts the model to return ONLY a JSON array
 @param {string} notes - The user's study notes
 @returns {Promise<Array<{question: string, answer: string}>>} - Array of flashcard objects
 */

export async function generateFlashcards(notes) {
    const apiKey = process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY;

    if (!apiKey) {
        throw new Error("DeepSeek API key not found.");
    }

    const response = await fetch(DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json", // body is json
            "Authorization": `Bearer ${apiKey}`, // user identity
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
                {
                    // instructions to the model
                    // System message sets the context and output format rules
                    role: "system",
                    content:
                        "You are a flashcard generator. When given study notes, you return ONLY a valid JSON array of flashcard objects. Each object must have exactly two fields: 'question' and 'answer'. No explanation, no markdown, no code blocks. Just the raw JSON array.",
                },
                // actual request
                {
                    role: "user",
                    content: `Convert these study notes into flashcards. Return ONLY a JSON array like this: [{"question":"...","answer":"..."}]

Generate between 5 and 15 flashcards depending on content length.
Keep questions clear and concise. Keep answers brief but complete.

Study notes:
${notes}`,
                },
            ],
            // Low temperature for consistent factual output
            // https://api-docs.deepseek.com/quick_start/parameter_settings
            temperature: 0.3,
            stream: false, // wait for full response
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(
            `DeepSeek API error: ${error?.error?.message || response.status}`
        );
    }

    const data = await response.json();

    // Extract text from compatible response structure
    // ?. means if you can, go deeper in structure, otherwise return undefined
    const rawText = data?.choices?.[0]?.message?.content;

    if (!rawText) {
        throw new Error("No content returned from DeepSeek.");
    }

    // Strip any markdown code blocks the model might add despite instructions
    const cleaned = rawText
        .replace(/```json/g, "")
        .replace(/```/g, "") // g - all occurances
        .trim();

    // Parse and validate the JSON array
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
        throw new Error("DeepSeek returned unexpected format — expected a JSON array.");
    }

    // Filter out any malformed items missing question or answer
    return parsed.filter(
        (item) =>
            typeof item.question === "string" &&
            typeof item.answer === "string" &&
            item.question.trim() &&
            item.answer.trim()
    );
}