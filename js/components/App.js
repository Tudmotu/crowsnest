import { ethers, BigNumber } from '../../node_modules/ethers/dist/ethers.esm.js';
import { PortfolioStats } from './PortfolioStats.js';
import { CollectionsTable } from './CollectionsTable.js';
import { Controls } from './Controls.js';
import * as Trades from '../data/Trades.js';
import * as opensea from '../opensea.js';
import * as analytics from '../analytics.js';

const { Web3Provider } = ethers.providers;

export class App {
    provider = null;
    statsComponent = new PortfolioStats(window.stats);
    tableComponent = new CollectionsTable(window.collectionList);
    controlsComponent = new Controls(window.controls);

    constructor () {
        this.controlsComponent.onWalletConnected(() => {
            history.pushState(null, '', './');
            this.init();
        });

        this.controlsComponent.onCustomAddress(customAddress => {
            const newUrl = `?address=${customAddress}`;
            history.pushState({ customAddress }, '', newUrl);
            this.init(customAddress);
        });

        this.controlsComponent.render();
    }

    start () {
        if (window.ethereum) analytics.walletExists();

        window.addEventListener('popstate', e => {
            const address = e.state && e.state.customAddress;
            this.init(address);
        });

        const searchParams = new URLSearchParams(location.search);

        this.init(searchParams.get('address'));
    }

    init (address) {
        if (address) {
            this.controlsComponent.setCustomAddressValue(address)
            this.initWithAddress(address);
            analytics.initFromQueryParam(customAddress);
        }
        else if (window.ethereum) {
            this.controlsComponent.setCustomAddressValue('')
            this.initWithEthereum();
        }
    }

    async initWithEthereum() {
        window.stats.classList.add('hidden');
        window.collectionList.classList.add('hidden');

        if (!this.provider) {
            this.provider = new Web3Provider(window.ethereum);
        }

        const signer = this.provider.getSigner();

        try {
            const address = await signer.getAddress();
            this.initWithAddress(address);
            analytics.walletConnected(address);
        }
        catch (e) {
            analytics.walletExistsNotConnected();
        }
    }

    async initWithAddress(address) {
        window.stats.classList.add('hidden');
        window.collectionList.classList.add('hidden');

        const [collections, investments] = await Promise.all([
            opensea.getCollections(address),
            Trades.getInvestmentStats(address, this.provider)
        ]);

        window.stats.classList.remove('hidden');
        window.collectionList.classList.remove('hidden');

        this.tableComponent.render(collections, investments);
        this.statsComponent.render(collections, investments);
    }
};
