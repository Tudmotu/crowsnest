import { ethers } from '../../node_modules/ethers/dist/ethers.esm.js';
import * as Icons from '../icons.js';
import * as opensea from '../opensea.js';

function hoursAgo (hours) {
    return Date.now() - 1000 * 60 * 60 * hours;
}

export class SalesTab {
    async open (collection, name, thumbnail) {
        document.body.classList.add('nooverflow');

        this.container = document.createElement('div');
        this.container.id = 'salesTabContainer';

        document.body.appendChild(this.container);

        const sales = await opensea.getSalesData(collection);
        const data = this.aggregateData(sales);

        this.container.addEventListener('click', e => {
            if (e.target.closest('#salesTabPane')) return;
            this.close();
        });

        this.container.innerHTML = `
            <div id="salesTabPane">
                <header>
                    <div id="salesTabCloseButton">&times;</div>
                    <img src="${thumbnail}" />
                    <h1>${name}</h1>
                </header>
                <h2>Volumes</h2>
                <section id="salesTabTotalsSection">
                    <div class="statCard" data-stat="total-24h">
                        <div class="statTitle">Total Sales - 24h</div>
                        <div class="statValue">${data.last24Hours.totalSales}</div>
                    </div>
                    <div class="statCard" data-stat="total-3h">
                        <div class="statTitle">Total Sales - 3h</div>
                        <div class="statValue">${data.last3Hours.totalSales}</div>
                    </div>
                </section>
                <h2>Price Points - 3h</h2>
                <section class="salesMeterContainer" id="salesTab3HoursSales">
                    ${this.renderSalesSection(data.last3Hours)}
                </section>
                <h2>Price Points - 24h</h2>
                <section class="salesMeterContainer" id="salesTab24HoursSales">
                    ${this.renderSalesSection(data.last24Hours)}
                </section>
            </div>
        `;

        const closeButton = this.container.querySelector('#salesTabCloseButton');
        closeButton.addEventListener('click', e => {
            this.close();
        });
    }

    close () {
        document.body.removeChild(this.container);
        document.body.classList.remove('nooverflow');
    }

    renderSalesSection (data) {
        return `
            <div class="salesMeter">
                <span>Low</span>
                <span>Median</span>
                <span>High</span>
            </div>
            <div class="soldItems">
                <div class="soldItemCard">
                    <img src="${data.low.thumbnail}" />
                    <div class="soldItemData">
                        ${Icons.ethLogo}
                        <span>${data.low.price.toFixed(2)}</span>
                    </div>
                </div>
                <div class="soldItemCard">
                    <img src="${data.median.thumbnail}" />
                    <div class="soldItemData">
                        ${Icons.ethLogo}
                        <span>${data.median.price.toFixed(2)}</span>
                    </div>
                </div>
                <div class="soldItemCard">
                    <img src="${data.high.thumbnail}" />
                    <div class="soldItemData">
                        ${Icons.ethLogo}
                        <span>${data.high.price.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    aggregateData (sales) {
        const simplified = [...sales].map(sale => {
            const formattedEth = ethers.utils.formatEther(sale.total_price);
            const etherPrice = parseFloat(formattedEth, 10);
            return {
                tokenId: sale.asset.token_id,
                thumbnail: sale.asset.image_thumbnail_url,
                price: etherPrice,
                timestamp: new Date(sale.created_date + 'Z').getTime()
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
