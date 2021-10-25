import { CollectionsTable } from '../../js/components/CollectionsTable.js';

describe.only('CollectionsTable component', () => {
    let container;
    let table;

    const ethLogo = `<img src="./eth.svg" class="ethLogo" />`;

    function getCell (collection, column) {
        return document.querySelector(`[data-collection="${collection}"][data-col="${column}"]`);
    }

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        table = new CollectionsTable(container);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('should render "Gas Spent", "Fees Paid" and ROI columns', async () => {
        const collections = [
            {
                slug: 'collectionA',
                owned_asset_count: 2,
                stats: {
                    floor_price: 0.1,
                    one_day_average_price: 0.2,
                    total_volume: 1,
                    one_day_volume: 0.1
                }
            },
            {
                slug: 'collectionB',
                owned_asset_count: 4,
                stats: {
                    floor_price: 0.2,
                    one_day_average_price: 0.5,
                    total_volume: 1,
                    one_day_volume: 0.1
                }
            }
        ];

        const rois = {
            collectionA: {
                investment: 0.08,
                sales: 0,
                gasPaid: 0.02,
                realized_roi: -0.08,
                feesPaid: 0
            },
            collectionB: {
                investment: 0.5,
                sales: 0.25,
                realized_roi: -0.25,
                gasPaid: 0.1,
                feesPaid: 0.05
            }
        };

        await table.render(collections);
        await table.renderROIs(rois, collections);

        expect(container).toContainHTML(`
            <div class="listHeader">Gas Spent</div>
            <div class="listHeader">Fees Paid</div>
        `);

        expect(getCell('collectionA', 'possibleRoi')).toHaveTextContent(/^\+0\.10$/);
        expect(getCell('collectionA', 'gas')).toHaveTextContent(/^0\.02$/);
        expect(getCell('collectionA', 'fees')).toHaveTextContent(/^0\.00$/);

        expect(getCell('collectionB', 'possibleRoi')).toHaveTextContent(/^\+0\.40$/);
        expect(getCell('collectionB', 'gas')).toHaveTextContent(/^0\.10$/);
        expect(getCell('collectionB', 'fees')).toHaveTextContent(/^0\.05$/);
    });
});
