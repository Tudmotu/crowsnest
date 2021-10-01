export class Controls {
    constructor (el) {
        this.el = el;
        this.walletButton = this.getEl('#connectWallet');
        this.separator = this.getEl('#controlsSeparator');
        this.addressInput = this.getEl('#customAddress');
        this.addressButton = this.getEl('#displayCustomAddress');

        if (window.ethereum) {
            this.walletButton.classList.remove('hidden');
            this.separator.classList.remove('hidden');
        }
    }

    render () {
        this.walletButton.addEventListener('click', async () => {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (!accounts || accounts.length === 0) return;

            this.onWalletConnectedCB();
        });

        this.addressButton.addEventListener('click', () => {
            this.onCustomAddressCB(this.addressInput.value);
        });
    }

    getEl (selector) {
        return this.el.querySelector(selector);
    }

    setCustomAddressValue (address) {
        this.addressInput.value = address;
    }

    onWalletConnected (cb) {
        this.onWalletConnectedCB = cb;
    }

    onCustomAddress (cb) {
        this.onCustomAddressCB = cb;
    }
}
