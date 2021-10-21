const Trades = require('../../js/data/Trades.js');
const opensea = require('../../js/opensea.js');
const { ethers, BigNumber } = require('ethers');

jest.mock('../../js/opensea.js');

describe('getInvestmentStats()', () => {
    let providerMock;

    beforeEach(() => {
        opensea.getTrades.mockResolvedValue([
            {
                collection_slug: 'collectionA',
                total_price: '700000000000000000',
                payment_token: {
                    symbol: 'ETH'
                },
                seller: {
                    address: 'useraddress1'
                },
                asset: {
                    asset_contract: {
                        seller_fee_basis_points: '1000'
                    }
                }
            }
        ]);

        opensea.getTransfers.mockResolvedValue([
            {
                collection_slug: 'collectionB',
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
                collection_slug: 'collectionD',
                from_account: {
                    user: {
                        username: 'NullAddress'
                    }
                },
                transaction: null
            },
            {
                collection_slug: 'collectionC',
                from_account: {
                    user: null
                },
                transaction: {
                    transaction_hash: 'minted1'
                }
            }
        ]);

        providerMock = {
            getTransactionReceipt: jest.fn().mockImplementation(hash => {
                return {
                    gasUsed: BigNumber.from('42000'),
                    effectiveGasPrice: BigNumber.from('20000000000'),
                };
            }),
            getTransaction: jest.fn().mockImplementation(hash => {
                if (hash === 'minted1') return {
                    gasLimit: BigNumber.from('420000'),
                    gasPrice: BigNumber.from('20000000000'),
                    value: BigNumber.from('40000000000000000')
                };
            })
        };
    });

    test('should calculate stats', async () => {
        const stats = await Trades.getInvestmentStats('userAddress1', providerMock);

        expect(stats).toStrictEqual({
            collectionA: {
                buys: 0,
                feesPaid: 0.07,
                gasPaid: 0,
                investment: 0,
                mints: 0,
                realized_roi: 0.7,
                sales: 0.7
            },
            collectionB: {
                buys: 0,
                feesPaid: 0,
                gasPaid: 0.00084,
                investment: 0.04,
                mints: 0.04,
                realized_roi: -0.04,
                sales: 0
            },
            collectionD: {
                buys: 0,
                feesPaid: 0,
                gasPaid: 0,
                investment: NaN,
                mints: NaN,
                realized_roi: NaN,
                sales: 0
            }
        });
    });

    test('should include collections from mints even if there are no OS transfers', async () => {
        const stats = await Trades.getInvestmentStats('userAddress1', providerMock);

        expect(stats).toHaveProperty('collectionA');
        expect(stats).toHaveProperty('collectionB');
    });
});
