const express = require('express');

const router = express.Router();

const DEFAULT_PROTOCOL_VERSION = '2025-03-26';
const CLIENT_INFO = {
    name: 'Gallama UI',
    version: '1.0.0',
};

const DISCOVERY_TIMEOUT_MS = 12000;

const readSsePayload = (rawText) => {
    const events = [];
    const chunks = rawText.split(/\r?\n\r?\n/);

    for (const chunk of chunks) {
        const trimmedChunk = chunk.trim();
        if (!trimmedChunk) {
            continue;
        }

        const dataLines = trimmedChunk
            .split(/\r?\n/)
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trimStart());

        if (dataLines.length === 0) {
            continue;
        }

        const joinedData = dataLines.join('\n').trim();
        if (!joinedData) {
            continue;
        }

        try {
            events.push(JSON.parse(joinedData));
        } catch (error) {
            // Ignore non-JSON events and continue looking for a JSON-RPC payload.
        }
    }

    return events;
};

const parseJsonRpcResponse = async (response) => {
    const rawText = await response.text();
    if (!rawText.trim()) {
        return null;
    }

    try {
        return JSON.parse(rawText);
    } catch (error) {
        const events = readSsePayload(rawText);
        const payload = events.find((event) => event?.jsonrpc === '2.0') ?? null;
        if (payload) {
            return payload;
        }

        throw new Error('Unable to parse MCP server response.');
    }
};

const createBaseHeaders = ({ authorizationToken, headers = {}, protocolVersion, sessionId }) => {
    const requestHeaders = {
        Accept: 'application/json, text/event-stream',
        'Content-Type': 'application/json',
        ...headers,
    };

    if (authorizationToken) {
        requestHeaders.Authorization = `Bearer ${authorizationToken}`;
    }

    if (protocolVersion) {
        requestHeaders['MCP-Protocol-Version'] = protocolVersion;
    }

    if (sessionId) {
        requestHeaders['MCP-Session-Id'] = sessionId;
    }

    return requestHeaders;
};

const readSessionId = (headers) => {
    return headers.get('MCP-Session-Id') ?? headers.get('mcp-session-id') ?? null;
};

const postJsonRpc = async ({
    url,
    payload,
    authorizationToken,
    headers,
    protocolVersion,
    sessionId,
    expectResponse = true,
}) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DISCOVERY_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: createBaseHeaders({
                authorizationToken,
                headers,
                protocolVersion,
                sessionId,
            }),
            body: JSON.stringify(payload),
            signal: controller.signal,
        });

        if (!response.ok) {
            const errorBody = await response.text();
            const error = new Error(errorBody || `MCP request failed with status ${response.status}.`);
            error.status = response.status;
            throw error;
        }

        if (!expectResponse) {
            return {
                payload: null,
                sessionId: readSessionId(response.headers) ?? sessionId,
            };
        }

        return {
            payload: await parseJsonRpcResponse(response),
            sessionId: readSessionId(response.headers) ?? sessionId,
        };
    } finally {
        clearTimeout(timeout);
    }
};

router.post('/discover', async (req, res) => {
    const {
        url,
        authorizationToken = '',
        headers = {},
    } = req.body ?? {};

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'A valid MCP server URL is required.' });
    }

    if (headers && (typeof headers !== 'object' || Array.isArray(headers))) {
        return res.status(400).json({ error: 'Headers must be a JSON object.' });
    }

    let sessionId = null;
    let negotiatedProtocolVersion = DEFAULT_PROTOCOL_VERSION;

    try {
        const initializeResult = await postJsonRpc({
            url,
            authorizationToken,
            headers,
            payload: {
                jsonrpc: '2.0',
                id: 'gallama-ui-initialize',
                method: 'initialize',
                params: {
                    protocolVersion: DEFAULT_PROTOCOL_VERSION,
                    capabilities: {},
                    clientInfo: CLIENT_INFO,
                },
            },
        });

        const initializePayload = initializeResult.payload;
        sessionId = initializeResult.sessionId;

        if (initializePayload?.error) {
            throw new Error(initializePayload.error.message || 'MCP initialize failed.');
        }

        if (!initializePayload?.result) {
            throw new Error('MCP server did not return an initialize result.');
        }

        negotiatedProtocolVersion = initializePayload.result.protocolVersion || DEFAULT_PROTOCOL_VERSION;

        await postJsonRpc({
            url,
            authorizationToken,
            headers,
            protocolVersion: negotiatedProtocolVersion,
            sessionId,
            expectResponse: false,
            payload: {
                jsonrpc: '2.0',
                method: 'notifications/initialized',
                params: {},
            },
        });

        const discoveredTools = [];
        let cursor;
        let page = 0;

        do {
            page += 1;

            const toolsResult = await postJsonRpc({
                url,
                authorizationToken,
                headers,
                protocolVersion: negotiatedProtocolVersion,
                sessionId,
                payload: {
                    jsonrpc: '2.0',
                    id: `gallama-ui-tools-list-${page}`,
                    method: 'tools/list',
                    params: cursor ? { cursor } : {},
                },
            });

            const toolsPayload = toolsResult.payload;
            sessionId = toolsResult.sessionId;

            if (toolsPayload?.error) {
                throw new Error(toolsPayload.error.message || 'MCP tools/list failed.');
            }

            const tools = Array.isArray(toolsPayload?.result?.tools) ? toolsPayload.result.tools : [];
            discoveredTools.push(...tools);
            cursor = toolsPayload?.result?.nextCursor;
        } while (cursor);

        return res.status(200).json({
            protocolVersion: negotiatedProtocolVersion,
            tools: discoveredTools,
        });
    } catch (error) {
        const status = error.status;
        const fallbackMessage = status && [400, 404, 405].includes(status)
            ? 'Tool discovery currently supports MCP Streamable HTTP endpoints. Legacy HTTP+SSE servers may still work in requests but cannot be auto-discovered here yet.'
            : 'Unable to discover MCP tools from this server.';

        return res.status(500).json({
            error: error.message || fallbackMessage,
            details: fallbackMessage,
        });
    } finally {
        if (sessionId) {
            try {
                await fetch(url, {
                    method: 'DELETE',
                    headers: createBaseHeaders({
                        authorizationToken,
                        headers,
                        protocolVersion: negotiatedProtocolVersion,
                        sessionId,
                    }),
                });
            } catch (error) {
                // Session cleanup is best-effort.
            }
        }
    }
});

module.exports = router;
