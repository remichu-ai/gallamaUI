export const API_ENDPOINT_TYPES = {
    CHAT_COMPLETIONS: 'chat_completions',
    RESPONSES: 'responses',
    ANTHROPIC_MESSAGES: 'anthropic_messages',
};

export const DEFAULT_API_ENDPOINT_TYPE = API_ENDPOINT_TYPES.CHAT_COMPLETIONS;

export const API_ENDPOINT_OPTIONS = [
    {
        value: API_ENDPOINT_TYPES.CHAT_COMPLETIONS,
        label: 'OpenAI Chat Completions',
    },
    {
        value: API_ENDPOINT_TYPES.RESPONSES,
        label: 'OpenAI Responses',
    },
    {
        value: API_ENDPOINT_TYPES.ANTHROPIC_MESSAGES,
        label: 'Anthropic Messages',
    },
];
