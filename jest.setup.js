import './node_modules/@testing-library/jest-dom';

jest.mock('./js/mixpanel_snippet.js', () => {
    global.mixpanel = new Proxy({}, {
        get () {
            return () => {};
        }
    });
});
