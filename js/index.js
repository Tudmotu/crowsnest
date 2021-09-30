import { ethers } from '../node_modules/ethers/dist/ethers.esm.js';
import { PortfolioStats } from './components/PortfolioStats.js';
import { CollectionsTable } from './components/CollectionsTable.js';
import * as opensea from './opensea.js';
import * as analytics from './analytics.js';

let provider;

const statsComponent = new PortfolioStats(window.stats);
const tableComponent = new CollectionsTable(window.collectionList);

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

    const collections = await opensea.getCollections(userAddress);

    window.stats.classList.remove('hidden');
    window.collectionList.classList.remove('hidden');

    tableComponent.render(collections);
    statsComponent.render(collections);
}
