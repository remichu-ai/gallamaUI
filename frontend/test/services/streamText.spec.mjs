import { flattenStreamText, pickPreferredStreamText } from '../../src/services/streamText.js';

describe('streamText helpers', () => {
    it('prefers the first non-empty reasoning field instead of concatenating aliases', () => {
        const reasoning = pickPreferredStreamText([
            { text: 'First reasoning copy.' },
            { text: 'Second reasoning copy.' },
            '',
        ]);

        expect(reasoning).toBe('First reasoning copy.');
    });

    it('still flattens nested structured text payloads', () => {
        const flattened = flattenStreamText({
            part: {
                text: 'Nested',
            },
        });

        expect(flattened).toBe('Nested');
    });
});
