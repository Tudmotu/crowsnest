//import { SalesTab } from '../../js/components/SalesTab.js';
const { SalesTab } = require('../../js/components/SalesTab.js');

let instance;

function hoursAgo (hours) {
    return Date.now() - 60 * 60 * hours;
}

function sale (id, thumbnail, price, timestamp) {
    return {
        total_price: price,
        created_date: new Date(timestamp).toISOString(),
        asset: {
            token_id: id,
            image_thumbnail_url: thumbnail
        }
    };
}

beforeEach(() => {
    instance = new SalesTab(window.body);
});

test('aggregateData() method', () => {
    const sales = [
        sale('1', '1.png', '10000000000000000', hoursAgo(1)),
        sale('4', '4.png', '12000000000000000', hoursAgo(2.2)),
        sale('2', '2.png', '14000000000000000', hoursAgo(1.2)),
        sale('0', '0.png', '30000000000000000', hoursAgo(0.4)),
        sale('6', '6.png', '45000000000000000', hoursAgo(5)),
        sale('7', '7.png', '110000000000000000', hoursAgo(10)),
        sale('8', '8.png', '120000000000000000', hoursAgo(14)),
        sale('5', '5.png', '220000000000000000', hoursAgo(2.8)),
        sale('3', '3.png', '300000000000000000', hoursAgo(1.7)),
        sale('9', '9.png', '700000000000000000', hoursAgo(23)),
    ];

    const aggregated = instance.aggregateData(sales);

    expect(aggregated).toEqual({
        last24Hours: {
            totalSales: 10,
            low: {
                tokenId: '1',
                thumbnail: '1.png',
                price: 0.01,
                timestamp: new Date(sales[0].created_date).getTime()
            },
            median: {
                tokenId: '6',
                thumbnail: '6.png',
                price: 0.045,
                timestamp: new Date(sales[4].created_date).getTime()
            },
            high: {
                tokenId: '9',
                thumbnail: '9.png',
                price: 0.7,
                timestamp: new Date(sales[9].created_date).getTime()
            }
        },
        last3Hours: {
            totalSales: 6,
            low: {
                tokenId: '1',
                thumbnail: '1.png',
                price: 0.01,
                timestamp: new Date(sales[0].created_date).getTime()
            },
            median: {
                tokenId: '2',
                thumbnail: '2.png',
                price: 0.014,
                timestamp: new Date(sales[2].created_date).getTime()
            },
            high: {
                tokenId: '3',
                thumbnail: '3.png',
                price: 0.3,
                timestamp: new Date(sales[8].created_date).getTime()
            }
        }
    });
});
