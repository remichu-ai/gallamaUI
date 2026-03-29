import YAML from 'yaml';

export const TOOL_PAYLOAD_FORMAT_JSON = 'json';
export const TOOL_PAYLOAD_FORMAT_YAML = 'yaml';

export const normalizeToolPayloadFormat = (format) => (
    format === TOOL_PAYLOAD_FORMAT_YAML ? TOOL_PAYLOAD_FORMAT_YAML : TOOL_PAYLOAD_FORMAT_JSON
);

const safeJsonParse = (value) => {
    if (typeof value !== 'string') {
        return null;
    }

    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};

const trimTrailingNewline = (value) => value.replace(/\n$/, '');
const YAML_INDENT_SIZE = 4;

const parseCompositeJsonString = (value) => {
    if (typeof value !== 'string') {
        return null;
    }

    const segments = value
        .split(/\n\s*\n+/)
        .map((segment) => segment.trim())
        .filter(Boolean);

    if (segments.length < 2) {
        return null;
    }

    const parsedSegments = segments.map((segment) => safeJsonParse(segment));
    return parsedSegments.every((segment) => segment !== null) ? parsedSegments : null;
};

const normalizeNestedToolPayloadValue = (value, visited = new WeakSet()) => {
    if (value === undefined || value === null || value === '') {
        return '';
    }

    if (typeof value === 'string') {
        const parsed = safeJsonParse(value.trim()) ?? parseCompositeJsonString(value);
        return parsed !== null ? normalizeNestedToolPayloadValue(parsed, visited) : value;
    }

    if (typeof value !== 'object') {
        return value;
    }

    if (visited.has(value)) {
        return value;
    }
    visited.add(value);

    if (Array.isArray(value)) {
        return value.map((item) => normalizeNestedToolPayloadValue(item, visited));
    }

    return Object.fromEntries(
        Object.entries(value).map(([key, nestedValue]) => [
            key,
            normalizeNestedToolPayloadValue(nestedValue, visited),
        ]),
    );
};

export const normalizeToolPayloadValue = (value) => {
    return normalizeNestedToolPayloadValue(value);
};

export const isStructuredToolPayloadValue = (value) => {
    const normalizedValue = normalizeToolPayloadValue(value);
    return Boolean(normalizedValue) && typeof normalizedValue === 'object';
};

const hasMeaningfulValue = (value) => !(
    value === undefined
    || value === null
    || value === ''
);

const isEmptyObjectValue = (value) => (
    Boolean(value)
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.keys(value).length === 0
);

const findStructuredContentCandidate = (value, visited = new WeakSet()) => {
    if (!hasMeaningfulValue(value) || typeof value !== 'object') {
        return undefined;
    }

    if (visited.has(value)) {
        return undefined;
    }
    visited.add(value);

    if (Array.isArray(value)) {
        for (const item of value) {
            const candidate = findStructuredContentCandidate(item, visited);
            if (hasMeaningfulValue(candidate)) {
                return candidate;
            }
        }
        return undefined;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'structured_content')) {
        return value.structured_content;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'structuredContent')) {
        return value.structuredContent;
    }

    for (const nestedValue of Object.values(value)) {
        const candidate = findStructuredContentCandidate(nestedValue, visited);
        if (hasMeaningfulValue(candidate)) {
            return candidate;
        }
    }

    return undefined;
};

const unwrapCommonPayloadWrapper = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return value;
    }

    const keys = Object.keys(value);
    if (keys.length !== 1) {
        return value;
    }

    const [onlyKey] = keys;
    if (!['result', 'data', 'output'].includes(onlyKey)) {
        return value;
    }

    return value[onlyKey];
};

export const getPreferredMcpOutputValue = (value) => {
    const normalizedValue = normalizeToolPayloadValue(value);
    const structuredContent = findStructuredContentCandidate(normalizedValue);

    if (!hasMeaningfulValue(structuredContent)) {
        return normalizedValue;
    }

    return unwrapCommonPayloadWrapper(normalizeToolPayloadValue(structuredContent));
};

export const formatToolPayloadValue = (value, format = TOOL_PAYLOAD_FORMAT_JSON) => {
    const normalizedValue = normalizeToolPayloadValue(value);

    if (normalizedValue === undefined || normalizedValue === null || normalizedValue === '') {
        return '';
    }

    if (normalizeToolPayloadFormat(format) === TOOL_PAYLOAD_FORMAT_YAML) {
        if (typeof normalizedValue === 'string') {
            return normalizedValue;
        }

        if (typeof normalizedValue === 'number' || typeof normalizedValue === 'boolean') {
            return String(normalizedValue);
        }

        if (isEmptyObjectValue(normalizedValue)) {
            return 'Nil';
        }

        return trimTrailingNewline(YAML.stringify(normalizedValue, {
            indent: YAML_INDENT_SIZE,
        }));
    }

    if (typeof normalizedValue === 'string') {
        return normalizedValue;
    }

    return JSON.stringify(normalizedValue, null, 2);
};
