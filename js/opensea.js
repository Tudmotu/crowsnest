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
    const batchSize = 300;
    const fullResults = [];
    let currentPage = 1;

    while (true) {
        const data = await api('collections', {
            asset_owner: userAddress,
            limit: batchSize,
            offset: (currentPage - 1) * batchSize
        });

        fullResults.push(...data);

        if (data.length < batchSize) break;

        await new Promise(r => setTimeout(r, 20));
        currentPage++;
    }

    return fullResults;
}

export async function getSalesData (collectionSlug) {
    const anHourInMs = 1000 * 60 * 60;
    const oneDayAgo = Date.now() - 24 * anHourInMs;
    const occurredAfter = oneDayAgo;

    const batchSize = 300;
    const fullResults = [];
    let currentPage = 1;

    while (true) {
        const data = await api('events', {
            collection_slug: collectionSlug,
            event_type: 'successful',
            occurred_after: occurredAfter,
            limit: batchSize,
            offset: (currentPage - 1) * batchSize
        });

        fullResults.push(...data.asset_events);

        if (data.asset_events.length < batchSize) break;

        await new Promise(r => setTimeout(r, 200));
        currentPage++;
    }

    return fullResults;
}
