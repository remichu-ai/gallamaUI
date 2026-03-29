const parseEventData = (event) => {
    if (!event.data) {
        return null;
    }

    try {
        return JSON.parse(event.data);
    } catch (error) {
        console.warn('Unable to parse SSE payload:', error, event.data);
        return null;
    }
};

async function* streamSSE(response) {
    if (!response.body) {
        throw new Error('Streaming response body is not available.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';
    let eventName = 'message';
    let dataLines = [];

    const flushEvent = () => {
        if (dataLines.length === 0) {
            return null;
        }

        const nextEvent = {
            event: eventName,
            data: dataLines.join('\n'),
        };

        eventName = 'message';
        dataLines = [];
        return nextEvent;
    };

    while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? '';

        for (const line of lines) {
            if (line === '') {
                const nextEvent = flushEvent();
                if (nextEvent) {
                    yield nextEvent;
                }
                continue;
            }

            if (line.startsWith(':')) {
                continue;
            }

            if (line.startsWith('event:')) {
                eventName = line.slice(6).trim();
                continue;
            }

            if (line.startsWith('data:')) {
                dataLines.push(line.slice(5).trimStart());
            }
        }

        if (done) {
            break;
        }
    }

    const trailingEvent = flushEvent();
    if (trailingEvent) {
        yield trailingEvent;
    }
}

export { parseEventData, streamSSE };
