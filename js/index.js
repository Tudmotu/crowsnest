import { ethers } from "../node_modules/ethers/dist/ethers.esm.js";
import * as opensea from './opensea.js';

let provider = new ethers.providers.Web3Provider(window.ethereum);

window.connectWallet.addEventListener('click', async () => {
    const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
    });

    if (!accounts || accounts.length === 0) return;

    init(accounts[0]);
});

if (window.ethereum) {
    const signer = provider.getSigner();

    try {
        init(await signer.getAddress());
    }
    catch (e) {
        console.log('Ethereum wallet exists, not connected');
    }
}

async function init(userAddress) {
    window.connectWallet.hidden = true;

    const collections = await opensea.getCollections(userAddress);

    const totalMinVal = collections.reduce((sum, current) => {
        return sum + current.owned_asset_count * current.stats.floor_price;
    }, 0).toFixed(2);

    window.collectionList.innerHTML = `
        <div id="collectionsHeader" class="collectionRow">
            <div></div>
            <div>Name</div>
            <div>Owned</div>
            <div>Floor</div>
            <div>Min. Value (&#x039E;${totalMinVal})</div>
            <div>Avg. Price</div>
            <div>1-day Avg. Price</div>
            <div>Total Volume</div>
            <div>1-day Volume</div>
            <div></div>
        </div>
        ${collections.sort(
            (a, b) => b.owned_asset_count - a.owned_asset_count
        ).map(collection => {
            const { stats } = collection;
            return `
                <div class="collectionRow">
                    <div><img src="${collection.image_url}" /></div>
                    <div>${collection.name}</div>
                    <div>${collection.owned_asset_count}</div>
                    <div>&#x039E;${stats.floor_price.toFixed(2)}</div>
                    <div>&#x039E;${(collection.owned_asset_count * stats.floor_price).toFixed(2)}</div>
                    <div>&#x039E;${stats.average_price.toFixed(2)}</div>
                    <div>&#x039E;${stats.one_day_average_price.toFixed(2)}</div>
                    <div>&#x039E;${stats.total_volume.toFixed(2)}</div>
                    <div>&#x039E;${stats.one_day_volume.toFixed(2)}</div>
                    <div><a href="https://opensea.io/activity/${collection.slug}" target="_blank">Activity</a></div>
                </div>
            `;
        })}
    `;
}
