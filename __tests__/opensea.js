import * as opensea from '../js/opensea.js';
import * as analytics from '../js/analytics.js';

jest.mock('../js/analytics.js');

describe('opensea module', () => {
    describe('failsafeRequest()', () => {
        beforeEach(() => {
            global.fetch = jest.fn();
            jest.spyOn(global, 'setTimeout').mockImplementation(cb => cb());
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should retry 2 times', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false
            }).mockResolvedValueOnce({
                ok: false
            }).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve('test')
            });

            const returnVal = await opensea.failsafeRequest('aaa');

            expect(returnVal).toBe('test');
        });

        it('should NOT report error if retry is OK', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false
            }).mockResolvedValueOnce({
                ok: true,
                json: () => {}
            });

            await opensea.failsafeRequest('aaa');

            expect(analytics.error).not.toHaveBeenCalled();
        });


        it('should report error if it fails 3 times', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false
            }).mockResolvedValueOnce({
                ok: false
            }).mockResolvedValueOnce({
                ok: false
            });

            await expect(async () => {
                await opensea.failsafeRequest('aaa');
            }).rejects.toThrow('OpenSea API retry failed');

            expect(analytics.error).toHaveBeenCalledWith('OpenSea API retry failed');
        });

        it('should call setTimeout with 1000 ms', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false
            }).mockResolvedValueOnce({
                ok: true,
                json: () => {}
            });

            await opensea.failsafeRequest('aaa');

            expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
        });

        it('should retry after 1 second if request fails', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false
            }).mockResolvedValueOnce({
                ok: true,
                json: () => {}
            });

            await opensea.failsafeRequest('aaa');

            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        it('should report warning if response.ok = false', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false
            }).mockResolvedValueOnce({
                ok: true,
                json: () => {}
            });

            await opensea.failsafeRequest('aaa');

            expect(analytics.warning).toHaveBeenCalledWith('OpenSea API request failed');
        });

        it('should report warning if status = 429', async () => {
            global.fetch.mockResolvedValueOnce({
                status: 429
            }).mockResolvedValueOnce({
                ok: true,
                json: () => {}
            });

            await opensea.failsafeRequest('aaa');

            expect(analytics.warning).toHaveBeenCalledWith('OpenSea API rate-limit');
        });

        it('should send request with supplied url', () => {
            opensea.failsafeRequest('aaa');

            expect(global.fetch).toHaveBeenCalledWith('aaa', {
                headers: { 'X-API-KEY': 'ba135508d825420780a3cd2effc30166' }
            });
        });
    });
});
