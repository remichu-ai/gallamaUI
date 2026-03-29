export const flattenStreamText = (value, visited = new Set()) => {
    if (!value) {
        return '';
    }

    if (typeof value === 'string') {
        return value;
    }

    if (typeof value === 'number') {
        return String(value);
    }

    if (Array.isArray(value)) {
        return value.map((item) => flattenStreamText(item, visited)).filter(Boolean).join('');
    }

    if (typeof value !== 'object') {
        return '';
    }

    if (visited.has(value)) {
        return '';
    }
    visited.add(value);

    const candidateKeys = [
        'text',
        'content',
        'thinking',
        'reasoning',
        'reasoning_content',
        'summary',
        'summary_text',
        'output_text',
        'delta',
    ];

    const collectedText = candidateKeys
        .map((key) => flattenStreamText(value[key], visited))
        .filter(Boolean)
        .join('');

    if (collectedText) {
        return collectedText;
    }

    return Object.values(value)
        .map((item) => flattenStreamText(item, visited))
        .filter(Boolean)
        .join('');
};

export const pickPreferredStreamText = (candidates = []) => {
    for (const candidate of candidates) {
        const text = flattenStreamText(candidate);
        if (text) {
            return text;
        }
    }

    return '';
};
