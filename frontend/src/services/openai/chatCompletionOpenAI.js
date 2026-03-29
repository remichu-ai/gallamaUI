import OpenAI from "openai";
import { flattenStreamText, pickPreferredStreamText } from '../streamText.js';

const NEWLINE = "$NEWLINE$"

const normalizeStreamToolCalls = (toolCalls = []) => {
    if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
        return [];
    }

    return toolCalls.map((toolCall, index) => ({
        index: toolCall?.index ?? index,
        id: toolCall?.id ?? toolCall?.call_id ?? null,
        type: toolCall?.type ?? 'function',
        function: {
            name: toolCall?.function?.name ?? '',
            arguments: flattenStreamText(toolCall?.function?.arguments ?? ''),
        },
    }));
};

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

    // Process messages to handle base64 images
    const processedMsgs = msgs.map(msg => {
        if (msg.content && Array.isArray(msg.content)) {
            return {
                ...msg,
                content: msg.content.map(item => {
                    if (item.type === 'image_url' && item.image_url.url.startsWith('data:')) {
                        // Keep the base64 data URL as is
                        return item;
                    }
                    return item;
                })
            };
        }
        return msg;
    });

    try {
        if (stream) {
            const completion = await openai.chat.completions.create({
                model,
                messages: processedMsgs,
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
                        const content = flattenStreamText(delta.content);
                        const reasoning = pickPreferredStreamText([
                            delta.reasoning,
                            delta.reasoning_content,
                            delta.thinking,
                            delta.reasoning_details,
                        ]);

                        const normalizedChunk = {
                            ...(content && { content }),
                            ...(reasoning && { reasoning }),
                        };

                        const toolCalls = normalizeStreamToolCalls(delta.tool_calls);
                        if (toolCalls.length > 0) {
                            normalizedChunk.tool_calls = toolCalls;
                        }

                        if (Object.keys(normalizedChunk).length > 0) {
                            yield normalizedChunk;
                        }
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
