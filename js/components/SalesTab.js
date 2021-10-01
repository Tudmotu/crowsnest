import { ethers } from '../../node_modules/ethers/dist/ethers.esm.js';
import * as opensea from '../opensea.js';

function hoursAgo (hours) {
    return Date.now() - 60 * 60 * hours;
}

export class SalesTab {
    async open (collection) {
        console.log(`Opening sales for ${collection}`)
        const sales = await opensea.getSalesData(collection);
        const data = this.aggregateData(sales);
    }

    aggregateData (sales) {
        const simplified = [...sales].map(sale => {
            const formattedEth = ethers.utils.formatEther(sale.total_price);
            const etherPrice = parseFloat(formattedEth, 10);
            return {
                tokenId: sale.asset.token_id,
                thumbnail: sale.asset.image_thumbnail_url,
                price: etherPrice,
                timestamp: new Date(sale.created_date).getTime()
            };
        });

        const results = {
            last24Hours: {},
            last3Hours: {}
        };

        const last24HoursData = [...simplified].filter(sale => {
            return sale.timestamp >= hoursAgo(24);
        });

        last24HoursData.sort((s1, s2) => s1.price - s2.price);

        results.last24Hours.totalSales = last24HoursData.length;
        results.last24Hours.low = last24HoursData[0];
        results.last24Hours.high = last24HoursData[last24HoursData.length - 1];
        results.last24Hours.median = last24HoursData[Math.floor((last24HoursData.length - 1)/2)];

        const last3HoursData = [...simplified].filter(sale => {
            return sale.timestamp >= hoursAgo(3);
        });

        last3HoursData.sort((s1, s2) => s1.price - s2.price);

        results.last3Hours.totalSales = last3HoursData.length;
        results.last3Hours.low = last3HoursData[0];
        results.last3Hours.high = last3HoursData[last3HoursData.length - 1];
        results.last3Hours.median = last3HoursData[Math.floor((last3HoursData.length - 1)/2)];

        return results;
    }
};
