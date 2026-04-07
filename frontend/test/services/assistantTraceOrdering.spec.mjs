import { buildOrderedTraceEntries } from '../../src/services/assistantTraceOrdering.js';

describe('buildOrderedTraceEntries', () => {
    it('preserves tool results after later reasoning only when they actually occur later', () => {
        const orderedEntries = buildOrderedTraceEntries([
            {
                id: 'reasoning-1',
                type: 'reasoning',
                text: 'The user wants me to calculate the expression.',
            },
            {
                id: 'call-1',
                type: 'tool_call',
                label: 'MCP call',
                name: 'run_command',
                server_label: 'code_server',
                argumentsValue: { command: 'python3 -c "print(1 + 1)"' },
                call_id: 'call-1',
                status: 'in_progress',
            },
            {
                id: 'result-1',
                type: 'tool_result',
                label: 'MCP result',
                call_id: 'call-1',
                outputValue: { stdout: '2\n' },
                status: 'completed',
            },
            {
                id: 'reasoning-2',
                type: 'reasoning',
                text: 'The result is 2.',
            },
        ]);

        expect(orderedEntries.map((entry) => ({
            id: entry.id,
            kind: entry.kind,
            traceType: entry.traceType ?? null,
        }))).toEqual([
            { id: 'reasoning-1', kind: 'reasoning', traceType: null },
            { id: 'call-1', kind: 'tool', traceType: 'tool_call' },
            { id: 'result-1', kind: 'tool', traceType: 'tool_result' },
            { id: 'reasoning-2', kind: 'reasoning', traceType: null },
        ]);

        expect(orderedEntries[2]).toMatchObject({
            name: 'run_command',
            serverLabel: 'code_server',
            status: 'completed',
            outputValue: { stdout: '2\n' },
        });
    });
});
