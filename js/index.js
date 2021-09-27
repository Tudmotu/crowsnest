import { ethers } from "../node_modules/ethers/dist/ethers.esm.js";
import * as opensea from './opensea.js';

let provider;

window.connectWallet.addEventListener('click', async () => {
    const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
    });

    if (!accounts || accounts.length === 0) return;

    history.pushState(null, '', './');
    init(accounts[0]);
});

window.displayCustomAddress.addEventListener('click', () => {
    const customAddress = window.customAddress.value;
    history.pushState({ customAddress }, '', `?address=${customAddress}`);
    init(customAddress);
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
}
else if (window.ethereum) {
    initWithEthereum();
}

async function initWithEthereum() {
    if (!provider) provider = new ethers.providers.Web3Provider(window.ethereum);
    ;
    const signer = provider.getSigner();

    try {
        init(await signer.getAddress());
    }
    catch (e) {
        console.log('Ethereum wallet exists, not connected');
    }
}

async function init(userAddress) {
    const collections = await opensea.getCollections(userAddress);

    const totalMinVal = collections.reduce((sum, current) => {
        return sum + current.owned_asset_count * current.stats.floor_price;
    }, 0).toFixed(2);

    window.collectionList.innerHTML = `
        <div class="listHeader"></div>
        <div class="listHeader">Name</div>
        <div class="listHeader">Owned</div>
        <div class="listHeader">Floor</div>
        <div class="listHeader">Min. Value (&#x039E;${totalMinVal})</div>
        <div class="listHeader">Avg. Price</div>
        <div class="listHeader">1-day Avg. Price</div>
        <div class="listHeader">Total Volume</div>
        <div class="listHeader">1-day Volume</div>
        <div class="listHeader"></div>

        ${collections.sort((a, b) => {
            const aVal = a.owned_asset_count * a.stats.floor_price;
            const bVal = b.owned_asset_count * b.stats.floor_price;
            return bVal - aVal;
        }).map(collection => {
            const { stats } = collection;
            return `
                <a class="thumbnail" href="https://opensea.io/collection/${collection.slug}" target="_blank">
                    <img src="${collection.image_url}" />
                </a>
                <a class="collectionName" href="https://opensea.io/collection/${collection.slug}" target="_blank">
                    ${collection.name}
                </a>
                <div>${collection.owned_asset_count}</div>
                <div>&#x039E;${stats.floor_price.toFixed(2)}</div>
                <div>&#x039E;${(collection.owned_asset_count * stats.floor_price).toFixed(2)}</div>
                <div>&#x039E;${stats.average_price.toFixed(2)}</div>
                <div>&#x039E;${stats.one_day_average_price.toFixed(2)}</div>
                <div>&#x039E;${stats.total_volume.toFixed(2)}</div>
                <div>&#x039E;${stats.one_day_volume.toFixed(2)}</div>
                <div><a href="https://opensea.io/activity/${collection.slug}" target="_blank">Activity</a></div>
            `;
        }).join('')}
    `;
}
