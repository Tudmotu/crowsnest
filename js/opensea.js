export async function getCollections (userAddress) {
    const url = `https://api.opensea.io/api/v1/collections?asset_owner=${userAddress}`;
    return (await fetch(url)).json();
}
