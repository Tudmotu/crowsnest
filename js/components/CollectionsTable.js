import { SalesTab } from './SalesTab.js';
import * as Icons from '../icons.js';
import { CollectionsState } from '../state/CollectionsState.js';
import { InvestmentsState } from '../state/InvestmentsState.js';
import { PortfolioSettings } from '../state/PortfolioSettings.js';

export class CollectionsTable {
    constructor (el) {
        this.el = el;

        this.el.addEventListener('click', e => {
            const menuButton = e.target.closest('.collectionMenuButton');
            const { collection, name, thumbnail, hidden } = menuButton.dataset;
            if (menuButton) {
                const rect = menuButton.getBoundingClientRect();
                const top = window.scrollY + rect.top;
                const left = window.scrollX + rect.left;
                const container = document.createElement('div');
                container.id = 'collectionListMenuContainer';
                container.innerHTML = `
                    <div id="collectionListMenu" style="top:${top}px;left:${left}px">
                        <div data-action="sales">Sales Data ${Icons.barChart}</div>
                        <div data-action="hide">
                            ${hidden === 'true' ? 'Unhide' : 'Hide'}
                            ${Icons.hiddenEye}
                        </div>
                        <a data-action="activity"
                            href="https://opensea.io/activity/${collection}"
                            target="_blank">
                            Activity ${Icons.externalLink}
                        </a>
                    </div>
                `;

                container.addEventListener('click', e => {
                    document.body.removeChild(container);
                });

                container.querySelector('[data-action=sales]').addEventListener('click', e => {
                    this.salesTab.open(collection, name, thumbnail);
                });

                container.querySelector('[data-action=hide]').addEventListener('click', e => {
                    if (hidden === 'false') {
                        CollectionsState.hide(collection);
                    }
                    else {
                        CollectionsState.unhide(collection);
                    }
                });

                document.body.appendChild(container);
            }
        });

        this.salesTab = new SalesTab(window.body);

        CollectionsState.subscribe(async () => {
            const collections = CollectionsState.get();
            const investments = InvestmentsState.get();

            await this.render(collections);
            this.renderROIs(investments, collections);
        });

        InvestmentsState.subscribe(async () => {
            const investments = InvestmentsState.get();
            const collections = CollectionsState.get();
            this.renderROIs(investments, collections);
        });

        PortfolioSettings.subscribe(async () => {
            this.el.dataset.showHidden = PortfolioSettings.get().showHidden;
        });
    }

    async render (collections) {
        const ethLogo = `<img src="./eth.svg" class="ethLogo" />`;

        this.el.innerHTML = `
            <div class="listHeader"></div>
            <div class="listHeader"></div>
            <div class="listHeader">Name</div>
            <div class="listHeader">Owned</div>
            <div class="listHeader">Floor</div>
            <div class="listHeader">Min. Value</div>
            <div class="listHeader">Possible ROI</div>
            <div class="listHeader">Realized ROI</div>
            <div class="listHeader">Sales</div>
            <div class="listHeader">Investment</div>
            <div class="listHeader">Gas Spent</div>
            <div class="listHeader">Fees Paid</div>
            <div class="listHeader">1-day Avg. Price</div>
            <div class="listHeader">Total Volume</div>
            <div class="listHeader">1-day Volume</div>

            ${collections.sort((a, b) => {
                const aVal = a.owned_asset_count * a.stats.floor_price;
                const bVal = b.owned_asset_count * b.stats.floor_price;
                return bVal - aVal;
            }).map(collection => {
                const { stats, slug, hidden } = collection;
                const minValue = (collection.owned_asset_count * stats.floor_price);
                return `
                    <div class="collectionMenuButton"
                        data-collection="${collection.slug}"
                        data-name="${collection.name}"
                        data-thumbnail="${collection.image_url}"
                        data-hidden="${!!hidden}"
                        data-col="menu"
                    >${Icons.menuDots}</div>
                    <a class="thumbnail" href="https://opensea.io/collection/${collection.slug}" target="_blank" data-hidden="${hidden}">
                        <img src="${collection.image_url ?? './assets/placeholder.svg'}" />
                    </a>
                    <a class="collectionName" href="https://opensea.io/collection/${collection.slug}" target="_blank" data-hidden="${hidden}">
                        ${collection.name}
                    </a>
                    <div data-hidden="${hidden}">${collection.owned_asset_count}</div>
                    <div data-hidden="${hidden}">${ethLogo}${stats.floor_price.toFixed(2)}</div>
                    <div data-hidden="${hidden}">${ethLogo}${minValue.toFixed(2)}</div>
                    <div data-collection="${collection.slug}"
                        data-roi
                        data-col="possibleRoi"
                        data-hidden="${hidden}"><span>${ethLogo}--</span></div>
                    <div data-collection="${collection.slug}"
                        data-roi
                        data-col="roi"
                        data-hidden="${hidden}"><span>${ethLogo}--</span></div>
                    <div data-collection="${collection.slug}"
                        data-col="sales"
                        data-hidden="${hidden}">${ethLogo}--</div>
                    <div data-collection="${collection.slug}"
                        data-col="investment"
                        data-hidden="${hidden}">${ethLogo}--</div>
                    <div data-collection="${collection.slug}"
                        data-col="gas"
                        data-hidden="${hidden}">${ethLogo}--</div>
                    <div data-collection="${collection.slug}"
                        data-col="fees"
                        data-hidden="${hidden}">${ethLogo}--</div>
                    <div data-hidden="${hidden}">${ethLogo}${stats.one_day_average_price.toFixed(2)}</div>
                    <div data-hidden="${hidden}">${ethLogo}${stats.total_volume.toFixed(2)}</div>
                    <div data-hidden="${hidden}">${ethLogo}${stats.one_day_volume.toFixed(2)}</div>
                `;
            }).join('')}
        `;
    }

    renderROIs (investments, collections) {
        const ethLogo = `<img src="./eth.svg" class="ethLogo" />`;

        Object.entries(investments).forEach(([slug, data]) => {
            const collection = collections.find(c => c.slug === slug);
            if (!collection) return;
            const { stats, owned_asset_count } = collection;
            const minValue = (owned_asset_count * stats.floor_price);
            const sales = data?.sales ?? 0;
            const investment = data?.investment ?? 0;
            const gas = data?.gasPaid ?? 0;
            const fees = data?.feesPaid ?? 0;
            const realizedRoi = data?.realized_roi ?? 0;
            const possibleRoi = realizedRoi + minValue - gas - fees;
            const roiSentiment = realizedRoi > 0 ? 'positive' : 'negative';
            const possibleRoiSentiment = possibleRoi > 0 ? 'positive' : 'negative';
            const getCell = col => {
                const selector = `[data-collection="${slug}"][data-col="${col}"]`;
                return this.el.querySelector(selector)
            };

            getCell('possibleRoi').innerHTML = `
                <span>
                    ${ethLogo}
                    ${possibleRoiSentiment === 'positive' ? '+' : ''}${possibleRoi.toFixed(2)}
                </span>
            `;

            getCell('roi').innerHTML = `
                <span>
                    ${ethLogo}
                    ${roiSentiment === 'positive' ? '+' : ''}${realizedRoi.toFixed(2)}
                </span>
            `;

            getCell('possibleRoi').dataset.roi = possibleRoiSentiment;
            getCell('roi').dataset.roi = roiSentiment;
            getCell('sales').innerHTML = `${ethLogo}${sales.toFixed(2)}`;
            getCell('investment').innerHTML = `${ethLogo}${investment.toFixed(2)}`;
            getCell('gas').innerHTML = `${ethLogo}${gas.toFixed(2)}`;
            getCell('fees').innerHTML = `${ethLogo}${fees.toFixed(2)}`;
        });
    }
}
