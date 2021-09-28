import './mixpanel_snippet.js';

mixpanel.init('8785e9f6efaf08ff28454aca7b2dee64', {
    debug: location.hostname === 'localhost'
}); 

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
