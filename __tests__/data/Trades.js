const Trades = require('../../js/data/Trades.js');
const opensea = require('../../js/opensea.js');
const { ethers, BigNumber } = require('ethers');

jest.mock('../../js/opensea.js');

describe('getInvestmentStats()', () => {
    let providerMock;

    beforeEach(() => {
        opensea.getTrades.mockResolvedValue([
            {
                collection_slug: 'collection-A',
                total_price: '700000000000000000',
                payment_token: {
                    symbol: 'ETH'
                },
                seller: {
                    address: 'useraddress1'
                }
            }
        ]);

        opensea.getTransfers.mockResolvedValue([
            {
                collection_slug: 'collection-B',
                from_account: {
                    user: {
                        username: 'NullAddress'
                    }
                },
                transaction: {
                    transaction_hash: 'minted1'
                }
            },
            {
                collection_slug: 'collection-C',
                from_account: {
                    user: null
                },
                transaction: {
                    transaction_hash: 'minted1'
                }
            }
        ]);

        providerMock = {
            getTransaction: jest.fn().mockImplementation(hash => {
                if (hash === 'minted1') return {
                    value: BigNumber.from('40000000000000000')
                };
            })
        };
    });

    test('should include collections from mints even if there are no OS transfers', async () => {
        const stats = await Trades.getInvestmentStats('userAddress1', providerMock);

        expect(stats).toHaveProperty('collection-A');
        expect(stats).toHaveProperty('collection-B');
    });
});
