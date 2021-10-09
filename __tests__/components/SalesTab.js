const { SalesTab } = require('../../js/components/SalesTab.js');
const opensea = require('../../js/opensea.js');

jest.mock('../../js/opensea.js');

let instance;

function hoursAgo (hours) {
    return Date.now() - 1000 * 60 * 60 * hours;
}

function sale (id, thumbnail, price, timestamp) {
    return {
        total_price: price,
        created_date: new Date(timestamp).toISOString().replace('Z', ''),
        asset: {
            token_id: id,
            image_thumbnail_url: thumbnail
        }
    };
}

const sales = [
    sale('1', '1.png', '11100000000000000', hoursAgo(1)),
    sale('4', '4.png', '12100000000000000', hoursAgo(2.2)),
    sale('2', '2.png', '14100000000000000', hoursAgo(1.2)),
    sale('0', '0.png', '30100000000000000', hoursAgo(0.4)),
    sale('6', '6.png', '45100000000000000', hoursAgo(5)),
    sale('7', '7.png', '111000000000000000', hoursAgo(10)),
    sale('8', '8.png', '121000000000000000', hoursAgo(14)),
    sale('5', '5.png', '221000000000000000', hoursAgo(2.8)),
    sale('3', '3.png', '301000000000000000', hoursAgo(1.7)),
    sale('9', '9.png', '701000000000000000', hoursAgo(23))
];

beforeEach(() => {
    opensea.getSalesData.mockResolvedValue(sales);
    document.body.innerHTML = '';
    instance = new SalesTab();
});

test('clicking the close button should remove container and "nooverflow" class from body', async () => {
    await instance.open('crypto-test');
    const container = document.getElementById('salesTabContainer');
    document.getElementById('salesTabCloseButton').click();
    expect(document.body).not.toContainElement(container);
    expect(document.body).not.toHaveClass('nooverflow');
});

test('when closed, should remove "nooverflow" class from body', async () => {
    await instance.open('crypto-test');
    document.getElementById('salesTabContainer').click();
    expect(document.body).not.toHaveClass('nooverflow');
});

test('when opened, should add "nooverflow" class to body', async () => {
    await instance.open('crypto-test');
    expect(document.body).toHaveClass('nooverflow');
});

test('sales tab should NOT be removed when clicking inside it', async () => {
    await instance.open('crypto-test');
    document.getElementById('salesTabPane').click();
    expect(document.getElementById('salesTabContainer')).not.toBe(null);
});

test('sales tab should be removed when clicking on backdrop', async () => {
    await instance.open('crypto-test');
    document.getElementById('salesTabContainer').click();
    expect(document.getElementById('salesTabContainer')).toBe(null);
});

test('price points showing max 2 decimal points', async () => {
    await instance.open('crypto-test');
    const pricePointSelector = (hours, i) => `#salesTab${hours}HoursSales .soldItemCard:nth-child(${i}) .soldItemData span`;
    const getPricePoint = (hours, i) => document.querySelector(pricePointSelector(hours, i));

    const low3HoursPricePoint = getPricePoint('3', '1');
    const med3HoursPricePoint = getPricePoint('3', '2');
    const high3HoursPricePoint = getPricePoint('3', '3');
    const low24HoursPricePoint = getPricePoint('24', '1');
    const med24HoursPricePoint = getPricePoint('24', '2');
    const high24HoursPricePoint = getPricePoint('24', '3');

    expect(low3HoursPricePoint).toHaveTextContent(/^0\.01$/);
    expect(med3HoursPricePoint).toHaveTextContent(/^0\.01$/);
    expect(high3HoursPricePoint).toHaveTextContent(/^0\.30$/);
    expect(low24HoursPricePoint).toHaveTextContent(/^0\.01$/);
    expect(med24HoursPricePoint).toHaveTextContent(/^0\.05$/);
    expect(high24HoursPricePoint).toHaveTextContent(/^0\.70$/);
});

test('pane should contain "total sales" section', async () => {
    await instance.open('crypto-test');
    const totalsSection = document.getElementById('salesTabTotalsSection');
    const blocks = [...totalsSection.querySelectorAll('.statCard')];

    expect(blocks.length).toBe(2);

    const title1 = blocks[0].querySelector('.statTitle').textContent;
    const title2 = blocks[1].querySelector('.statTitle').textContent;
    expect(title1).toBe('Total Sales - 24h');
    expect(title2).toBe('Total Sales - 3h');

    const value1 = blocks[0].querySelector('.statValue').textContent;
    const value2 = blocks[1].querySelector('.statValue').textContent;
    expect(value1).toBe('10');
    expect(value2).toBe('6');
});

test('open() should attach containers to dom', async () => {
    await instance.open('crypto-test');

    const container = document.getElementById('salesTabContainer');
    const pane = document.getElementById('salesTabPane');
    expect(container).not.toBe(null);
    expect(pane).not.toBe(null);
    expect(pane.parentNode).toBe(container);
});

test('open() should invoke opensea.getSalesData() with appropriate collection', () => {
    instance.open('crypto-test');
    expect(opensea.getSalesData).toHaveBeenCalledWith('crypto-test');
});

test('aggregateData() method', () => {
    const aggregated = instance.aggregateData(sales);

    expect(aggregated).toEqual({
        last24Hours: {
            totalSales: 10,
            low: {
                tokenId: '1',
                thumbnail: '1.png',
                price: 0.0111,
                timestamp: new Date(sales[0].created_date + 'Z').getTime()
            },
            median: {
                tokenId: '6',
                thumbnail: '6.png',
                price: 0.0451,
                timestamp: new Date(sales[4].created_date + 'Z').getTime()
            },
            high: {
                tokenId: '9',
                thumbnail: '9.png',
                price: 0.701,
                timestamp: new Date(sales[9].created_date + 'Z').getTime()
            }
        },
        last3Hours: {
            totalSales: 6,
            low: {
                tokenId: '1',
                thumbnail: '1.png',
                price: 0.0111,
                timestamp: new Date(sales[0].created_date + 'Z').getTime()
            },
            median: {
                tokenId: '2',
                thumbnail: '2.png',
                price: 0.0141,
                timestamp: new Date(sales[2].created_date + 'Z').getTime()
            },
            high: {
                tokenId: '3',
                thumbnail: '3.png',
                price: 0.301,
                timestamp: new Date(sales[8].created_date + 'Z').getTime()
            }
        }
    });
});
