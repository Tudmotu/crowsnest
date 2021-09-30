import { ethers } from '../node_modules/ethers/dist/ethers.esm.js';
import { PortfolioStats } from './components/PortfolioStats.js';
import * as opensea from './opensea.js';
import * as analytics from './analytics.js';
import * as Icons from './icons.js';

let provider;

const statsComponent = new PortfolioStats(window.stats);

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

    statsComponent.render(collections);
}
