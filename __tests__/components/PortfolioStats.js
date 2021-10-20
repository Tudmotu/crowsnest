import { PortfolioStats } from '../../js/components/PortfolioStats.js';

jest.mock('../../node_modules/chartjs-plugin-datalabels/dist/chartjs-plugin-datalabels.min.js', () => {
    global.ChartDataLabels = {};
});

describe('PortfolioStats component', () => {
    function statBlock (id, statValue) {
        return `
            <div id="${id}" class="statCard">
                <div class="statTitle">Some Title</div>
                <div class="statValue">${statValue || '--'}</div>
            </div>
        `;
    }

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
    });

    test('should render correct values in stats', async () => {
        const stats = new PortfolioStats(document.body);
        console.log('test');
        await stats.render(Promise.resolve([
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
        ]), Promise.resolve({
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
        }));

        1.25 - 0.75

        function getValueEl (id) { return document.querySelector(`#${id} .statValue`); }

        expect(getValueEl('statTotalOwned')).toHaveTextContent(/^6$/)
        expect(getValueEl('statMinValue')).toHaveTextContent(/^1.00$/)
        expect(getValueEl('statAvgValue')).toHaveTextContent(/^2.40$/)
        expect(getValueEl('statCollections')).toHaveTextContent(/^2$/)
        expect(getValueEl('statPossibleROI')).toHaveTextContent(/^\+0.50$/)
        expect(getValueEl('statTotalInvestment')).toHaveTextContent(/^0.58$/)
    });
});
