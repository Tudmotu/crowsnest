import { CollectionsTable } from '../../js/components/CollectionsTable.js';
import { CollectionsState } from '../../js/state/CollectionsState.js';

jest.mock('../../js/state/CollectionsState.js');

describe('CollectionsTable component', () => {
    let container;
    let table;
    let collections;
    let rois;

    const ethLogo = `<img src="./eth.svg" class="ethLogo" />`;

    function getCell (collection, column) {
        return document.querySelector(`[data-collection="${collection}"][data-col="${column}"]`);
    }

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        table = new CollectionsTable(container);

        collections = [
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

        rois = {
            collectionA: {
                investment: 0.08,
                sales: 0,
                gasPaid: 0.02,
                feesPaid: 0,
                realized_roi: -0.1
            },
            collectionB: {
                investment: 0.5,
                sales: 0.25,
                gasPaid: 0.1,
                feesPaid: 0.05,
                realized_roi: -0.4
            }
        };

    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('should remove container when clicking on backdrop', async () => {
        await table.render(collections);
        getCell('collectionA', 'menu').click();
        let container = document.getElementById('collectionListMenuContainer');
        container.click();
        container = document.getElementById('collectionListMenuContainer');
        expect(container).toBe(null);
    });

    test('should invoke salesTab.open() and remove container when sales button clicked', async () => {
        jest.spyOn(table.salesTab, 'open');

        await table.render(collections);
        getCell('collectionA', 'menu').click();
        const sales = document.querySelector('#collectionListMenu [data-action=sales]');
        sales.click();

        expect(table.salesTab.open).toHaveBeenCalled();

        const container = document.getElementById('collectionListMenuContainer');
        expect(container).toBe(null);
    });

    test('should remove menu container after hide button clicked', async () => {
        await table.render(collections);
        getCell('collectionA', 'menu').click();
        const hide = document.querySelector('#collectionListMenu [data-action=hide]');
        hide.click();
        const container = document.getElementById('collectionListMenuContainer');
        expect(container).toBe(null);
    });

    test('should invoke CollectionsState.unhide() when unhide button clicked', async () => {
        collections[0].hidden = true;
        await table.render(collections);
        getCell('collectionA', 'menu').click();
        const hide = document.querySelector('#collectionListMenu [data-action=hide]');
        hide.click();
        expect(CollectionsState.unhide).toHaveBeenCalled();
    });

    test('should invoke CollectionsState.hide() when hide button clicked', async () => {
        await table.render(collections);
        getCell('collectionA', 'menu').click();
        const hide = document.querySelector('#collectionListMenu [data-action=hide]');
        hide.click();
        expect(CollectionsState.hide).toHaveBeenCalled();
    });

    test('should open popup menu when button clicked', async () => {
        await table.render(collections);
        getCell('collectionA', 'menu').click();
        const menu = document.getElementById('collectionListMenu');

        expect(menu).not.toBe(null);

        const salesButton = menu.querySelector('[data-action=sales]');
        const hideButton = menu.querySelector('[data-action=hide]');
        const activityButton = menu.querySelector('a[data-action=activity]');

        expect(salesButton).not.toBe(null);
        expect(hideButton).not.toBe(null);
        expect(activityButton).not.toBe(null);
    });

    test('should not throw error even if "stats" object is empty', async () => {
        const collectionsWithNoStats = [
            {
                slug: 'collectionA',
                owned_asset_count: 2,
                stats: {}
            }
        ];

        await table.render(collectionsWithNoStats);

        expect(getCell('collectionA', 'floor')).toHaveTextContent(/^--$/);
        expect(getCell('collectionA', 'oneDayAvg')).toHaveTextContent(/^--$/);
        expect(getCell('collectionA', 'totalVolume')).toHaveTextContent(/^--$/);
        expect(getCell('collectionA', 'oneDayVolume')).toHaveTextContent(/^--$/);
    });

    test('should render "Gas Spent", "Fees Paid" and ROI columns', async () => {
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

    test('should render image with "./assets/placeholder.svg" when image is null', async () => {
        await table.render(collections);
        expect(container).toContainHTML(`<img src="./assets/placeholder.svg">`);
    });
});
