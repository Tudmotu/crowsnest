import { PortfolioStats } from '../../js/components/PortfolioStats.js';
import { InvestmentsStateComponent } from '../../js/state/InvestmentsState.js';
import { CollectionsStateComponent } from '../../js/state/CollectionsState.js';
import { AccountStateComponent } from '../../js/state/AccountState.js';

jest.mock('../../node_modules/chartjs-plugin-datalabels/dist/chartjs-plugin-datalabels.min.js', () => {
    global.ChartDataLabels = {};
});

describe('PortfolioStats component', () => {
    function getValueEl (id) {
        return document.querySelector(`#${id} .statValue`);
    }

    function statBlock (id, statValue) {
        return `
            <div id="${id}" class="statCard">
                <div class="statTitle">Some Title</div>
                <div class="statValue">${statValue || '--'}</div>
            </div>
        `;
    }

    let account;
    let investments;
    let collections;
    let mockInvestments;
    let mockCollections;

    beforeEach(() => {
        document.body.innerHTML = `
            ${statBlock('statTotalOwned')}
            ${statBlock('statCollections')}
            ${statBlock('statMinValue')}
            ${statBlock('statAvgValue')}
            ${statBlock('statPossibleROI')}
            ${statBlock('statTotalInvestment')}
            ${statBlock('statCollectionBreakdown', `
                <canvas id="statCollectionPieChart"></canvas>
            `)}
        `;

        window.ResizeObserver = class ResizeObserver {
            observe () {}
        };

        account = new AccountStateComponent();
        account.setAddress('test_address');
        collections = new CollectionsStateComponent(account);
        investments = new InvestmentsStateComponent(collections);

        mockCollections = [
            {
                owned_asset_count: 2,
                stats: {
                    floor_price: 0.1,
                    one_day_average_price: 0.2
                }
            },
            {
                owned_asset_count: 4,
                stats: {
                    floor_price: 0.2,
                    one_day_average_price: 0.5
                }
            }
        ];

        mockInvestments = {
            collectionA: {
                investment: 0.08,
                sales: 0,
                gasPaid: 0.02,
                feesPaid: 0
            },
            collectionB: {
                investment: 0.5,
                sales: 0.25,
                gasPaid: 0.1,
                feesPaid: 0.05
            }
        };
    });

    test('should clear stats when investments change to empty object', async () => {
        const stats = new PortfolioStats(document.body, investments, collections);

        await investments.set(mockInvestments);
        await collections.set(mockCollections);
        await investments.set({});

        expect(getValueEl('statPossibleROI')).toHaveTextContent(/^--$/);
        expect(getValueEl('statTotalInvestment')).toHaveTextContent(/^--$/);
    });

    test('should render stats when InvestmentsState changes', async () => {
        const stats = new PortfolioStats(document.body, investments, collections);

        await investments.set(mockInvestments);
        await collections.set(mockCollections);

        expect(getValueEl('statPossibleROI')).toHaveTextContent(/^\+0.50$/)
        expect(getValueEl('statTotalInvestment')).toHaveTextContent(/^0.58$/)
    });

    test('should render correct values in roi stats', async () => {
        const stats = new PortfolioStats(document.body, investments, collections);

        await stats.renderRoiStats({
            collectionA: {
                investment: 0.08,
                sales: 0,
                gasPaid: 0.02,
                feesPaid: 0
            },
            collectionB: {
                investment: 0.5,
                sales: 0.25,
                gasPaid: 0.1,
                feesPaid: 0.05
            }
        }, [
            {
                owned_asset_count: 2,
                stats: {
                    floor_price: 0.1,
                    one_day_average_price: 0.2
                }
            },
            {
                owned_asset_count: 4,
                stats: {
                    floor_price: 0.2,
                    one_day_average_price: 0.5
                }
            }
        ]);

        expect(getValueEl('statPossibleROI')).toHaveTextContent(/^\+0.50$/)
        expect(getValueEl('statTotalInvestment')).toHaveTextContent(/^0.58$/)
    });

    test('should render correct values in collections stats', async () => {
        const stats = new PortfolioStats(document.body, investments, collections);

        await stats.renderCollectionsStats([
            {
                owned_asset_count: 2,
                stats: {
                    floor_price: 0.1,
                    one_day_average_price: 0.2
                }
            },
            {
                owned_asset_count: 4,
                stats: {
                    floor_price: 0.2,
                    one_day_average_price: 0.5
                }
            }
        ]);

        expect(getValueEl('statTotalOwned')).toHaveTextContent(/^6$/)
        expect(getValueEl('statMinValue')).toHaveTextContent(/^1.00$/)
        expect(getValueEl('statAvgValue')).toHaveTextContent(/^2.40$/)
        expect(getValueEl('statCollections')).toHaveTextContent(/^2$/)
    });
});
