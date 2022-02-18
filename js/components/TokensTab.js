import { ethers } from '../../node_modules/ethers/dist/ethers.esm.js';
import { Component } from './Component.js';
import { AccountState } from '../state/AccountState.js';
import * as Icons from '../icons.js';
import * as opensea from '../opensea.js';

export class TokensTab extends Component {
    async open (collection, name, thumbnail) {
        document.body.classList.add('nooverflow');

        this.container = document.createElement('div');
        this.container.id = 'tokensTabContainer';
        this.container.classList.add('paneContainer');

        document.body.appendChild(this.container);

        this.container.addEventListener('click', e => {
            if (e.target.closest('#tokensTabPane')) return;
            this.close();
        });

        this.container.innerHTML = `
            <div id="tokensTabPane" class="pane">
                <header>
                    <div id="tokensTabCloseButton" class="closeButton" data-ref="close">&times;</div>
                    <img src="${thumbnail}" />
                    <h1>${name}</h1>
                </header>
                <h2>NFTs</h2>
                <div data-ref="loader">${Icons.loader}</div>
                <section data-ref="assets"></div>
            </div>
        `;

        this.ref('close').addEventListener('click', e => {
            this.close();
        });

        this.fetchAssets(collection);
    }

    close () {
        document.body.removeChild(this.container);
        document.body.classList.remove('nooverflow');
    }

    async fetchAssets (collection) {
        const { address } = AccountState.get();
        const tokens = await opensea.getOwnedAssets(address, collection);
        this.ref('loader').classList.add('hidden');
        this.ref('assets').innerHTML = `${
            tokens.map(token => `
                <a href="${token.permalink}" class="token" target="_blank">
                    <div class="tokenImage" style="background-image:url('${token.image_preview_url}')"></div>
                    <div>${token.name}</div>
                </a>
            `).join('')
        }`;
    }
};
