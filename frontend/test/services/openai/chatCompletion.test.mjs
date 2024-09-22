import { chatCompletionOpenAI } from '../../../src/services/openai/chatCompletionOpenAI.js';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('chatCompletionOpenAI', () => {
    const apiKey = 'mock-api-key';
    const url = 'http://127.0.0.1:8000/v1';
    const model = 'mistral';

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should make a POST request to the correct URL with the right parameters', async () => {
        const mockResponse = {
            choices: [
                {message: {content: 'Test response 1'}},
                {message: {content: 'Test response 2'}}
            ]
        };
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const msgs = [{role: 'user', content: 'Hello'}];
        const extra_body = {temperature: 0.7};

        const resultPromise = chatCompletionOpenAI(apiKey, url, model, msgs, extra_body);

        expect(fetchMock).toHaveBeenCalledWith(
            'http://127.0.0.1:8000/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mock-api-key'
                },
                body: JSON.stringify({
                    model: 'mistral',
                    messages: msgs,
                    temperature: 0.7
                })
            }
        );

        const result = await resultPromise;

        expect(typeof result.next).toBe('function');

        expect(await result.next()).toEqual({value: 'Test response 1', done: false});
        expect(await result.next()).toEqual({value: 'Test response 2', done: false});
        expect(await result.next()).toEqual({value: undefined, done: true});
    });

    it('should throw an error when the response is not ok', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({}), {status: 400});

        const msgs = [{role: 'user', content: 'Hello'}];

        await expect(chatCompletionOpenAI(apiKey, url, model, msgs)).rejects.toThrow('HTTP error! status: 400');
    });

    it('should return valid responses when calling the actual API', async () => {
        fetchMock.disableMocks();

        const msgs = [{role: 'user', content: 'Hello'}];
        const extra_body = {temperature: 0.7};

        const result = await chatCompletionOpenAI(apiKey, url, model, msgs, extra_body);
        const resultsArray = [];

        for await (const msg of result) {
            resultsArray.push(msg);
        }

        expect(resultsArray.length).toBeGreaterThan(0);
    });
});