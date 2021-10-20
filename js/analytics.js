import './mixpanel_snippet.js';

const debug = location.hostname === 'localhost';

if (debug) {
    mixpanel.init('b386f4b5dd2c5cdf5361cdfad56924cf', { debug }); 
}
else {
    mixpanel.init('8785e9f6efaf08ff28454aca7b2dee64'); 
}

export function walletExists () {
    mixpanel.track('wallet_exists');
}

export function walletExistsNotConnected () {
    mixpanel.track('wallet_not_connected');
}

export function walletConnected (address) {
    mixpanel.track('wallet_connected');
}

export function initFromQueryParam (address) {
    mixpanel.track('init_from_query_param');
}
