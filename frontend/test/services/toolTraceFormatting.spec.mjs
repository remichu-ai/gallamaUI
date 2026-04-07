import {
    normalizeAnthropicMessage,
    normalizeResponsesOutputItems,
} from '../../src/services/api/requestTransforms.js';
import {
    formatToolPayloadValue,
    getPreferredMcpOutputValue,
    TOOL_PAYLOAD_FORMAT_YAML,
} from '../../src/services/toolTraceFormatting.js';

describe('toolTraceFormatting', () => {
    it('prefers structured_content for MCP trace output', () => {
        const normalized = normalizeResponsesOutputItems([
            {
                type: 'mcp_call',
                id: 'mcp-call-1',
                server_label: 'weather',
                name: 'forecast',
                arguments: '{"location":"Singapore","days":3}',
                output: {
                    text: 'Cloudy with occasional rain',
                    structured_content: {
                        location: 'Singapore',
                        days: 3,
                        forecast: [
                            { day: 'Mon', condition: 'cloudy' },
                            { day: 'Tue', condition: 'rain' },
                        ],
                    },
                },
                status: 'completed',
            },
        ]);

        expect(normalized.trace_items).toHaveLength(1);
        expect(normalized.trace_items[0]).toMatchObject({
            type: 'tool_activity',
            argumentsValue: {
                location: 'Singapore',
                days: 3,
            },
            outputValue: {
                location: 'Singapore',
                days: 3,
                forecast: [
                    { day: 'Mon', condition: 'cloudy' },
                    { day: 'Tue', condition: 'rain' },
                ],
            },
        });
    });

    it('supports camelCase structuredContent in MCP output', () => {
        expect(getPreferredMcpOutputValue({
            text: 'summary',
            structuredContent: {
                city: 'Tokyo',
                temperature_c: 23,
            },
        })).toEqual({
            city: 'Tokyo',
            temperature_c: 23,
        });
    });

    it('extracts nested structured content from composite JSON text blobs', () => {
        const compositeOutput = [
            JSON.stringify({
                timezone: 'UTC',
                utc_time: '2026-03-29T13:59:40.708932+00:00',
                local_time: '2026-03-29T13:59:40.708932+00:00',
                weekday: 'Sunday',
                source: 'local server clock',
            }),
            JSON.stringify([
                [
                    {
                        structured_content: {
                            result: JSON.stringify({
                                timezone: 'UTC',
                                utc_time: '2026-03-29T13:59:40.708932+00:00',
                                local_time: '2026-03-29T13:59:40.708932+00:00',
                                weekday: 'Sunday',
                                source: 'local server clock',
                            }),
                        },
                    },
                ],
            ]),
        ].join('\n\n');

        expect(getPreferredMcpOutputValue(compositeOutput)).toEqual({
            timezone: 'UTC',
            utc_time: '2026-03-29T13:59:40.708932+00:00',
            local_time: '2026-03-29T13:59:40.708932+00:00',
            weekday: 'Sunday',
            source: 'local server clock',
        });
    });

    it('formats structured tool payloads as YAML', () => {
        const yaml = formatToolPayloadValue(
            {
                location: 'Singapore',
                forecast: [
                    { day: 'Mon', condition: 'cloudy' },
                    { day: 'Tue', condition: 'rain' },
                ],
            },
            TOOL_PAYLOAD_FORMAT_YAML,
        );

        expect(yaml).toContain('location: Singapore');
        expect(yaml).toContain('- day: Mon');
        expect(yaml).toContain('condition: rain');
    });

    it('renders empty YAML arguments as Nil', () => {
        expect(formatToolPayloadValue({}, TOOL_PAYLOAD_FORMAT_YAML)).toBe('Nil');
    });

    it('uses deeper indentation for nested YAML values', () => {
        const yaml = formatToolPayloadValue(
            {
                result: {
                    timezone: 'UTC',
                },
            },
            TOOL_PAYLOAD_FORMAT_YAML,
        );

        expect(yaml).toContain('result:\n    timezone: UTC');
    });

    it('formats extracted MCP structured content blobs as YAML', () => {
        const compositeOutput = [
            JSON.stringify({ note: 'raw text result that should not win' }),
            JSON.stringify([
                [
                    {
                        structured_content: {
                            result: JSON.stringify({
                                timezone: 'UTC',
                                weekday: 'Sunday',
                            }),
                        },
                    },
                ],
            ]),
        ].join('\n\n');

        const yaml = formatToolPayloadValue(
            getPreferredMcpOutputValue(compositeOutput),
            TOOL_PAYLOAD_FORMAT_YAML,
        );

        expect(yaml).toContain('timezone: UTC');
        expect(yaml).toContain('weekday: Sunday');
        expect(yaml).not.toContain('structured_content');
    });

    it('preserves reasoning blocks in trace order for Responses output items', () => {
        const normalized = normalizeResponsesOutputItems([
            {
                type: 'reasoning',
                id: 'reasoning-1',
                content: [{ text: 'First thinking block.' }],
            },
            {
                type: 'function_call',
                id: 'call-1',
                call_id: 'call-1',
                name: 'search_docs',
                arguments: '{"query":"trace"}',
            },
            {
                type: 'function_call_output',
                id: 'call-1-output',
                call_id: 'call-1',
                output: 'result',
            },
            {
                type: 'reasoning',
                id: 'reasoning-2',
                content: [{ text: 'Second thinking block.' }],
            },
            {
                type: 'message',
                id: 'final-message',
                role: 'assistant',
                phase: 'final_answer',
                content: [{ type: 'output_text', text: 'Done.' }],
            },
        ]);

        expect(normalized.trace_items.map((item) => item.type)).toEqual([
            'reasoning',
            'tool_call',
            'tool_result',
            'reasoning',
        ]);
        expect(normalized.trace_items[0].text).toBe('First thinking block.');
        expect(normalized.trace_items[3].text).toBe('Second thinking block.');
        expect(normalized.reasoning).toBe('First thinking block.\nSecond thinking block.');
    });

    it('preserves Anthropic thinking and tool order in trace items', () => {
        const normalized = normalizeAnthropicMessage({
            role: 'assistant',
            content: [
                { type: 'thinking', thinking: 'Look up the weather first.' },
                {
                    type: 'tool_use',
                    id: 'tool-1',
                    name: 'forecast',
                    input: { location: 'Singapore' },
                },
                { type: 'thinking', thinking: 'Now summarize the result.' },
                { type: 'text', text: 'It looks rainy.' },
            ],
        });

        expect(normalized.trace_items.map((item) => item.type)).toEqual([
            'reasoning',
            'tool_call',
            'reasoning',
        ]);
        expect(normalized.trace_items[0].text).toBe('Look up the weather first.');
        expect(normalized.trace_items[1]).toMatchObject({
            name: 'forecast',
            argumentsValue: {
                location: 'Singapore',
            },
        });
        expect(normalized.trace_items[2].text).toBe('Now summarize the result.');
    });

    it('normalizes Anthropic MCP tool use and result blocks', () => {
        const normalized = normalizeAnthropicMessage({
            role: 'assistant',
            content: [
                {
                    type: 'mcp_tool_use',
                    id: 'mcp-tool-1',
                    name: 'run_command',
                    server_name: 'code_server',
                    input: { command: 'sleep 4; echo done' },
                },
                {
                    type: 'mcp_tool_result',
                    tool_use_id: 'mcp-tool-1',
                    is_error: false,
                    content: [{
                        type: 'text',
                        text: '{\n  "exit_code": 0,\n  "stdout": "done\\n"\n}\n\n[{"structured_content":{"exit_code":0,"stdout":"done\\n"}}]',
                    }],
                },
                { type: 'text', text: 'done' },
            ],
        });

        expect(normalized.tool_calls).toEqual([
            {
                index: 0,
                id: 'mcp-tool-1',
                type: 'function',
                function: {
                    name: 'run_command',
                    arguments: '{"command":"sleep 4; echo done"}',
                },
            },
        ]);
        expect(normalized.trace_items).toEqual([
            expect.objectContaining({
                id: 'mcp-tool-1',
                type: 'tool_call',
                label: 'MCP call',
                name: 'run_command',
                server_label: 'code_server',
                argumentsValue: {
                    command: 'sleep 4; echo done',
                },
                call_id: 'mcp-tool-1',
                status: 'in_progress',
            }),
            expect.objectContaining({
                type: 'tool_result',
                label: 'MCP result',
                call_id: 'mcp-tool-1',
                outputValue: {
                    exit_code: 0,
                    stdout: 'done\n',
                },
                status: 'completed',
            }),
        ]);
        expect(normalized.content).toBe('done');
    });
});
