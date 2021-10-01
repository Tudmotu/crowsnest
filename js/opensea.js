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

export async function getSalesData (collectionSlug) {
    const anHourInMs = 1000 * 60 * 60;
    const oneDayAgo = Date.now() - 24 * anHourInMs;
    const occurredAfter = oneDayAgo;

    const batchSize = 300;
    const fullResults = [];
    let currentPage = 1;

    while (true) {
        const url = `https://api.opensea.io/api/v1/events?collection_slug=${collectionSlug}&event_type=successful&occurred_after=${occurredAfter}&limit=${batchSize}&offset=${(currentPage - 1) * batchSize}`;

        const data = await (await fetch(url)).json();

        console.log(data);

        fullResults.push(...data.asset_events);

        if (data.asset_events.length < batchSize) break;

        await new Promise(r => setTimeout(r, 200));
        currentPage++;
    }

    return fullResults;
}
