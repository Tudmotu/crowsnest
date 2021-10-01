async function api (endpoint, params) {
    const qs = new URLSearchParams(params).toString();
    const url = `https://api.opensea.io/api/v1/${endpoint}?${qs}`;

    return (await fetch(url, {
        headers: {
            'X-API-KEY': 'ba135508d825420780a3cd2effc30166'
        }
    })).json();
}

export async function getCollections (userAddress) {
    return api('collections', {
        asset_owner: userAddress
    });
}
