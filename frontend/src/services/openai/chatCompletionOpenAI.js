import OpenAI from "openai";

const NEWLINE = "$NEWLINE$"

const chatCompletionOpenAI = async ({
    apiKey,
    url,
    model,
    msgs,
    extra_body,
    stream = true,
    tools = [],
    tool_choice = "auto"
}) => {
    const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: url,
        dangerouslyAllowBrowser: true
    });

    const controller = new AbortController();

    try {
        if (stream) {
            const completion = await openai.chat.completions.create({
                model,
                messages: msgs,
                stream: true,
                tools:tools,
                tool_choice: tool_choice,
                ...extra_body,
            });

            // Create an async generator to process the stream
            const processStream = async function* () {
                for await (const chunk of completion) {
                    const delta = chunk.choices[0]?.delta;
                    if (delta) {
                        yield delta;
                    }
                }
            };

            return [processStream(), controller];
        } else {
            const completion = await openai.chat.completions.create({
                model,
                messages: msgs,
                stream: false,
                tools:tools,
                tool_choice: tool_choice,
                ...extra_body,
            });
            return [completion];
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

export { chatCompletionOpenAI };