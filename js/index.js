import { ethers } from '../node_modules/ethers/dist/ethers.esm.js';
import '../node_modules/chart.js/dist/chart.js';
import '../node_modules/chartjs-plugin-datalabels/dist/chartjs-plugin-datalabels.min.js';
import * as opensea from './opensea.js';
import * as analytics from './analytics.js';
import * as Icons from './icons.js';

let provider;


window.Chart.register(window.ChartDataLabels);

window.connectWallet.addEventListener('click', async () => {
    const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
    });

    if (!accounts || accounts.length === 0) return;

    history.pushState(null, '', './');
    initWithEthereum();
});

window.displayCustomAddress.addEventListener('click', () => {
    const customAddress = window.customAddress.value;
    history.pushState({ customAddress }, '', `?address=${customAddress}`);
    init(customAddress);
    analytics.initFromQueryParam(customAddress);
});

window.addEventListener('popstate', e => {
    const address = e.state && e.state.customAddress;

    if (address) {
        window.customAddress.value = address;
        init(address);
    }
    else if (window.ethereum) {
        window.customAddress.value = '';
        initWithEthereum();
    }
});

const searchParams = new URLSearchParams(location.search);
if (searchParams.get('address')){
    const address = searchParams.get('address');
    window.customAddress.value = address;
    init(address);
    analytics.initFromQueryParam(address);
}
else if (window.ethereum) {
    initWithEthereum();
}

if (window.ethereum) {
    window.connectWallet.classList.remove('hidden');
    window.controlsSeparator.classList.remove('hidden');
    analytics.walletExists();
}

window.collectionList.addEventListener('click', e => {
    const menuButton = e.target.closest('.collectionMenuButton');
    const { collection } = menuButton.dataset;
    if (menuButton) {
        const rect = menuButton.getBoundingClientRect();
        const top = window.scrollY + rect.top;
        const left = window.scrollX + rect.left;
        const container = document.createElement('div');
        container.id = 'collectionListMenuContainer';
        container.innerHTML = `
            <div id="collectionListMenu" style="top:${top}px;left:${left}px">
                <div class="disabled">Sales Data ${Icons.barChart}</div>
                <a href="https://opensea.io/activity/${collection}" target="_blank">
                    Activity ${Icons.externalLink}
                </a>
            </div>
        `;

        container.addEventListener('click', e => {
            if (e.target.closest('#collectionListMenu')) return;
            document.body.removeChild(container);
        });

        document.body.appendChild(container);
    }
});

async function initWithEthereum() {
    window.stats.classList.add('hidden');
    window.collectionList.classList.add('hidden');

    if (!provider) provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    try {
        const address = await signer.getAddress();
        init(address);
        analytics.walletConnected(address);
        window.customAddress.value = '';
    }
    catch (e) {
        console.log('Ethereum wallet exists, not connected');
        analytics.walletExistsNotConnected();
    }
}

async function init(userAddress) {
    if (window.ethereum) {
        window.connectWallet.classList.remove('hidden');
        window.controlsSeparator.classList.remove('hidden');
    }

    const ethLogo = `<img src="./eth.svg" class="ethLogo" />`;
    const collections = await opensea.getCollections(userAddress);

    const totalOwned = collections.reduce((sum, curr) => sum + curr.owned_asset_count, 0);
    const totalMinVal = collections.reduce((sum, current) => {
        return sum + current.owned_asset_count * current.stats.floor_price;
    }, 0).toFixed(2);
    const totalAvgVal = collections.reduce((sum, current) => {
        return sum + current.owned_asset_count * current.stats.one_day_average_price;
    }, 0).toFixed(2);

    window.statTotalOwned.querySelector('.statValue').textContent = totalOwned;
    window.statMinValue.querySelector('.statValue').innerHTML = `${ethLogo}${totalMinVal}`;
    window.statAvgValue.querySelector('.statValue').innerHTML = `${ethLogo}${totalAvgVal}`;
    window.statCollections.querySelector('.statValue').textContent = collections.length;

    window.collectionList.innerHTML = `
        <div class="listHeader"></div>
        <div class="listHeader"></div>
        <div class="listHeader">Name</div>
        <div class="listHeader">Owned</div>
        <div class="listHeader">Floor</div>
        <div class="listHeader">Min. Value</div>
        <div class="listHeader">Avg. Price</div>
        <div class="listHeader">1-day Avg. Price</div>
        <div class="listHeader">Total Volume</div>
        <div class="listHeader">1-day Volume</div>

        ${collections.sort((a, b) => {
            const aVal = a.owned_asset_count * a.stats.floor_price;
            const bVal = b.owned_asset_count * b.stats.floor_price;
            return bVal - aVal;
        }).map(collection => {
            const { stats } = collection;
            return `
                <div class="collectionMenuButton" data-collection="${collection.slug}">${Icons.menuDots}</div>
                <a class="thumbnail" href="https://opensea.io/collection/${collection.slug}" target="_blank">
                    <img src="${collection.image_url}" />
                </a>
                <a class="collectionName" href="https://opensea.io/collection/${collection.slug}" target="_blank">
                    ${collection.name}
                </a>
                <div>${collection.owned_asset_count}</div>
                <div>${ethLogo}${stats.floor_price.toFixed(2)}</div>
                <div>${ethLogo}${(collection.owned_asset_count * stats.floor_price).toFixed(2)}</div>
                <div>${ethLogo}${stats.average_price.toFixed(2)}</div>
                <div>${ethLogo}${stats.one_day_average_price.toFixed(2)}</div>
                <div>${ethLogo}${stats.total_volume.toFixed(2)}</div>
                <div>${ethLogo}${stats.one_day_volume.toFixed(2)}</div>
            `;
        }).join('')}
    `;

    window.stats.classList.remove('hidden');
    window.collectionList.classList.remove('hidden');

    renderPieChart(window.statCollectionPieChart, collections);
}

function renderPieChart (el, collections) {
    const bodyStyle = getComputedStyle(document.body);
    const textColor = bodyStyle.getPropertyValue('--c-white');
    const c1 = bodyStyle.getPropertyValue('--c-blue-grey');
    const c2 = bodyStyle.getPropertyValue('--c-light');
    const c3 = bodyStyle.getPropertyValue('--c-secondary');
    const c4 = bodyStyle.getPropertyValue('--c-main');
    const c5 = bodyStyle.getPropertyValue('--c-black');
    const colors = [c1, c2, c3, c4, c5];

    const collectionsOrderedByVal = collections.sort((a, b) =>{
        const aVal = a.owned_asset_count * a.stats.floor_price;
        const bVal = b.owned_asset_count * b.stats.floor_price;
        return bVal - aVal;
    });

    const topFourCollections = collectionsOrderedByVal.slice(0, 4);
    const otherCollections = collectionsOrderedByVal.slice(4);

    const labels = topFourCollections.map(c => c.name);
    labels.push('Others');

    const series = topFourCollections.map(c => {
        return c.owned_asset_count * c.stats.floor_price;
    });

    series.push(otherCollections.reduce((sum, c) => {
        return sum + (c.owned_asset_count * c.stats.floor_price);
    }, 0));

    if (window.statPieChartInstance) {
        window.statPieChartInstance.data = {
            labels,
            datasets: [
                {
                    label: 'Collections',
                    data: series,
                    backgroundColor: colors
                }
            ]
        };
        window.statPieChartInstance.update();
    }
    else {
        window.statPieChartInstance = new Chart(window.statCollectionPieChart, {
            type: 'pie',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Collections',
                        data: series,
                        backgroundColor: colors
                    }
                ]
            },
            plugins: [ChartDataLabels],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    datalabels: {
                        color: textColor,
                        formatter: (value, context) => `Ξ${value.toFixed(2)}`,
                        font: {
                            family: '"Fira Sans"',
                            size: 16
                        }
                    }
                }
            }
        });
    }
}
