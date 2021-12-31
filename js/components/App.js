import { ethers, providers, BigNumber } from '../../node_modules/ethers/dist/ethers.esm.js';
import { PortfolioStats } from './PortfolioStats.js';
import { CollectionsTable } from './CollectionsTable.js';
import { Controls } from './Controls.js';
import { ErrorToast } from './GlobalErrorMessage.js';
import * as Trades from '../data/Trades.js';
import * as opensea from '../opensea.js';
import * as analytics from '../analytics.js';
import { CollectionsState } from '../state/CollectionsState.js';
import { AccountState } from '../state/AccountState.js';
import { InvestmentsState } from '../state/InvestmentsState.js';
import { GlobalErrorState } from '../state/GlobalErrorState.js';
import { PortfolioSettings } from '../state/PortfolioSettings.js';

const { Web3Provider, WebSocketProvider } = providers;

export class App {
    provider = null;
    statsComponent = new PortfolioStats(window.stats, InvestmentsState, CollectionsState);
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

        document.getElementById('showHiddenCheckbox').addEventListener('change', e => {
            PortfolioSettings.toggleHidden(e.target.checked);
        });

        document.getElementById('refreshCollections').addEventListener('click', e => {
            this.refreshCollections();
        });

        this.errorToast = new ErrorToast(GlobalErrorState);
    }

    async start () {
        if (window.ethereum) analytics.walletExists();

        window.addEventListener('popstate', e => {
            const address = e.state && e.state.customAddress;
            this.init(address);
        });

        const searchParams = new URLSearchParams(location.search);

        await this.init(searchParams.get('address'));
    }

    async init (address) {
        if (address) {
            this.controlsComponent.setCustomAddressValue(address)
            await this.initWithAddress(address);
            analytics.initFromQueryParam(customAddress);
        }
        else if (window.ethereum) {
            this.controlsComponent.setCustomAddressValue('')
            await this.initWithEthereum();
        }
    }

    async initWithEthereum() {
        if (!this.provider) {
            this.provider = new Web3Provider(window.ethereum);
        }

        const signer = this.provider.getSigner();

        const address = await signer.getAddress();
        await this.initWithAddress(address);
        analytics.walletConnected(address);
    }

    async initWithAddress(address) {
        window.mainLoader.classList.remove('hidden');
        window.stats.classList.add('hidden');
        window.collectionList.classList.add('hidden');
        window.portfolioSettings.classList.add('hidden');

        if (!this.provider) {
            if (window.ethereum) {
                this.provider = new Web3Provider(window.ethereum);
            }
            else {
                this.provider = new WebSocketProvider(
                    'wss://mainnet.infura.io/ws/v3/f43414318fcc4cbc9b4f12c26fa11055'
                );
            }
        }

        await InvestmentsState.set({});
        await CollectionsState.set([]);
        await AccountState.setAddress(address);

        window.mainLoader.classList.remove('hidden');
        await this.refreshCollections();
        window.mainLoader.classList.add('hidden');

        window.stats.classList.remove('hidden');
        window.collectionList.classList.remove('hidden');
        window.portfolioSettings.classList.remove('hidden');
    }

    async refreshCollections () {
        window.refreshIndicator.classList.remove('hidden');

        const { address } = await AccountState.get();
        const collectionsRequest = opensea.getCollections(address);
        const investmentsRequest = Trades.getInvestmentStats(address, this.provider);

        this.tableComponent.pauseRendering();
        this.statsComponent.pauseRendering();

        InvestmentsState.set(investmentsRequest);
        CollectionsState.set(collectionsRequest);

        try {
            const collections = await collectionsRequest;

            for (let collection of collections) {
                const statResponse = await opensea.getStats(collection.slug);
                const i = collections.indexOf(collection) + 1;
                CollectionsState.updateStats(collection.slug, statResponse.stats);
                window.loaderCollectionCount.textContent = `
                    Loading collections... ${i}/${collections.length}
                `;
            }
        }
        catch (e) {
            GlobalErrorState.set('Failed while fetching collections from OpenSea API. Please try refreshing the page.');
            throw new Error(`Failed loading collections: ${e.message}`);
        }

        await Promise.all([
            this.tableComponent.resumeRendering(),
            this.statsComponent.resumeRendering()
        ]);

        window.refreshIndicator.classList.add('hidden');
    }
};
