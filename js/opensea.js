import * as analytics from './analytics.js';

export async function failsafeRequest (url, attemptNumber = 1) {
    async function request () {
        return await fetch(url, {
            headers: { 'X-API-KEY': 'ba135508d825420780a3cd2effc30166' }
        });
    }

    let response;

    try {
        response = await request();

        if (response.status === 429) throw new Error('OpenSea API rate-limit');
        if (response.ok !== true) throw new Error('OpenSea API request failed');

        return response.json();
    }
    catch (e) {
        if (attemptNumber === 3) {
            analytics.error('OpenSea API retry failed');
            throw new Error('OpenSea API retry failed');
        }
        else {
            analytics.warning(e.message);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return failsafeRequest(url, attemptNumber + 1);
        }
    }
}

async function api (endpoint, params) {
    const qs = new URLSearchParams(params).toString();
    const url = `https://api.opensea.io/api/v1/${endpoint}?${qs}`;

    return await failsafeRequest(url);
}

async function getWithCursor (endpoint, params, dataProp) {
    const fullResults = [];
    let response;
    let hasNext = true;
    let cursor;

    while (hasNext) {
        const fields = { ...params };
        if (cursor) fields.cursor = cursor;
        const response = await api(endpoint, fields);

        const data = dataProp ? response[dataProp] : response;

        fullResults.push(...data);
        cursor = response.next;
        hasNext = !!cursor;
    }

    return fullResults;
}

async function getInBatches (endpoint, params, dataProp, batchSize = 300) {
    const fullResults = [];
    let currentPage = 0;

    while (true) {
        const response = await api(endpoint, {
            limit: batchSize,
            offset: currentPage * batchSize,
            ...params
        });

        const data = dataProp ? response[dataProp] : response;

        fullResults.push(...data);

        if (data.length < batchSize) break;

        currentPage++;
    }

    return fullResults;
}

export async function getOwnedAssets (owner, collection) {
    return await getInBatches('assets', {
        owner,
        collection
    }, 'assets', 50);
}

export async function getTransfers (userAddress) {
    return await getWithCursor('events', {
        account_address: userAddress,
        event_type: 'transfer'
    }, 'asset_events');
}

export async function getTrades (userAddress) {
    return await getWithCursor('events', {
        account_address: userAddress,
        event_type: 'successful'
    }, 'asset_events');
}

export async function getStats (collection) {
    const url = `https://api.opensea.io/api/v1/collection/${collection}/stats`;

    return await failsafeRequest(url);
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

        currentPage++;
    }

    return fullResults;
}

export async function getSalesData (collectionSlug) {
    const anHourInMs = 1000 * 60 * 60;
    const oneDayAgo = Date.now() - 24 * anHourInMs;
    const occurredAfter = oneDayAgo;

    return await getWithCursor('events', {
        account_address: userAddress,
        occurred_after: occurredAfter,
        event_type: 'transfer'
    }, 'asset_events');
}
