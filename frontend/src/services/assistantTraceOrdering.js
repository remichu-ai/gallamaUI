const ACTUAL_TOOL_TRACE_TYPES = new Set(['tool_call', 'tool_result', 'tool_activity']);

const toSingleLine = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const formatMeta = (...parts) => parts.filter(Boolean).join(' • ');

const formatReasoningMeta = (reasoning) => {
    const wordCount = toSingleLine(reasoning).split(' ').filter(Boolean).length;
    if (wordCount === 0) {
        return '';
    }

    return `${wordCount} word${wordCount === 1 ? '' : 's'}`;
};

export const buildOrderedTraceEntries = (traceItems = []) => {
    const orderedEntries = [];
    const toolContextByCallId = new Map();

    traceItems.forEach((item, index) => {
        if (item?.type === 'reasoning') {
            const reasoningText = item.text ?? '';
            if (!toSingleLine(reasoningText)) {
                return;
            }

            orderedEntries.push({
                id: item.id ?? `reasoning-${index}`,
                kind: 'reasoning',
                text: reasoningText,
                meta: formatReasoningMeta(reasoningText),
            });
            return;
        }

        if (!ACTUAL_TOOL_TRACE_TYPES.has(item?.type)) {
            return;
        }

        const linkedToolContext = item.call_id ? toolContextByCallId.get(item.call_id) : null;
        const entry = {
            id: item.id ?? `${item.type}-${index}`,
            kind: 'tool',
            traceType: item.type,
            label: item.label ?? 'Tool activity',
            name: item.name ?? linkedToolContext?.name ?? item.server_label ?? 'Tool',
            serverLabel: item.server_label ?? linkedToolContext?.serverLabel ?? '',
            status: item.status ?? '',
            text: item.text ?? '',
            argumentsValue: item.argumentsValue ?? '',
            outputValue: item.outputValue ?? '',
            error: item.error ?? '',
            callId: item.call_id ?? null,
            meta: formatMeta(
                item.label ?? 'Tool activity',
                item.server_label ?? linkedToolContext?.serverLabel ?? '',
                item.status ?? '',
            ),
        };

        if (entry.callId && item.type === 'tool_call') {
            toolContextByCallId.set(entry.callId, {
                name: entry.name,
                serverLabel: entry.serverLabel,
            });
        }

        orderedEntries.push(entry);
    });

    return orderedEntries;
};

