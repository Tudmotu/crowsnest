import '@testing-library/jest-dom';
import getRandomValues from 'get-random-values';

window.crypto = { getRandomValues };

global.fetch = jest.fn().mockImplementation(async (url) => {
    return { ok: true, json: () => ({}) };
});

jest.mock('./js/mixpanel_snippet.js', () => {
    global.mixpanel = new Proxy({}, {
        get () {
            return () => {};
        }
    });
});
