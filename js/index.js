import { ethers } from '../node_modules/ethers/dist/ethers.esm.js';
import { PortfolioStats } from './components/PortfolioStats.js';
import { CollectionsTable } from './components/CollectionsTable.js';
import { Controls } from './components/Controls.js';
import * as opensea from './opensea.js';
import * as analytics from './analytics.js';

let provider;

const statsComponent = new PortfolioStats(window.stats);
const tableComponent = new CollectionsTable(window.collectionList);
const controlsComponent = new Controls(window.controls);

controlsComponent.render();

controlsComponent.onWalletConnected(() => {
    history.pushState(null, '', './');
    init();
});

controlsComponent.onCustomAddress(customAddress => {
    const newUrl = `?address=${customAddress}`;
    history.pushState({ customAddress }, '', newUrl);
    init(customAddress);
    analytics.initFromQueryParam(customAddress);
});

if (window.ethereum) {
    analytics.walletExists();
}

window.addEventListener('popstate', e => {
    const address = e.state && e.state.customAddress;
    init(address);
});

const searchParams = new URLSearchParams(location.search);

init(searchParams.get('address'));

function init (address) {
    if (address) {
        controlsComponent.setCustomAddressValue(address)
        initWithAddress(address);
    }
    else if (window.ethereum) {
        controlsComponent.setCustomAddressValue('')
        initWithEthereum();
    }
}

async function initWithEthereum() {
    window.stats.classList.add('hidden');
    window.collectionList.classList.add('hidden');

    if (!provider) provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    try {
        const address = await signer.getAddress();
        initWithAddress(address);
        analytics.walletConnected(address);
        controlsComponent.setCustomAddressValue('')
    }
    catch (e) {
        analytics.walletExistsNotConnected();
    }
}

async function initWithAddress(address) {
    window.stats.classList.add('hidden');
    window.collectionList.classList.add('hidden');

    const collections = await opensea.getCollections(address);

    window.stats.classList.remove('hidden');
    window.collectionList.classList.remove('hidden');

    tableComponent.render(collections);
    statsComponent.render(collections);

    analytics.initFromQueryParam(address);
}
