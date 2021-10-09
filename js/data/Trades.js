import { ethers, BigNumber } from '../../node_modules/ethers/dist/ethers.esm.js';
import * as opensea from '../opensea.js';

export async function getInvestmentStats (address, provider) {
    const trades = await opensea.getTrades(address);

    const ethTrades = trades.filter(t => {
        return t.payment_token.symbol === 'ETH';
    });

    const tradesByCollection = {};

    for (let trade of ethTrades) {
        const collection = trade.collection_slug;
        const ethPrice = ethers.utils.formatEther(trade.total_price);

        if (!tradesByCollection[collection]) {
            tradesByCollection[collection] = {
                buys: [],
                sales: [],
                total_buys: BigNumber.from('0'),
                total_sales: BigNumber.from('0')
            };
        }

        const collectionData = tradesByCollection[collection];

        if (trade.seller.address.toLowerCase() === address.toLowerCase()) {
            collectionData.sales.push(trade);
            collectionData.total_sales = collectionData.total_sales.add(BigNumber.from(trade.total_price));
        }
        else {
            collectionData.buys.push(trade);
            collectionData.total_buys = collectionData.total_buys.add(BigNumber.from(trade.total_price));
        }
    }

    for (let data of Object.values(tradesByCollection)) {
        data.total_buys_eth = ethers.utils.formatEther(data.total_buys);
        data.total_sales_eth = ethers.utils.formatEther(data.total_sales);
    }

    const mints = (await opensea.getTransfers(address)).filter(t => {
        return t.from_account.user?.username === 'NullAddress';
    });

    const mintTxsByCollection = {};
    for (let mint of mints) {
        const collection = mint.collection_slug;

        if (!mintTxsByCollection[collection]) {
            mintTxsByCollection[collection] = {
                txs: new Set(),
                value: BigNumber.from('0')
            };
        }

        const txHash = mint.transaction.transaction_hash;
        mintTxsByCollection[collection].txs.add(txHash);
    }

    await Promise.all(Object.entries(mintTxsByCollection).map(([collection, collectionData]) => {
        return Promise.all([...collectionData.txs].map(async hash => {
            const tx = await provider.getTransaction(hash);
            const data = mintTxsByCollection[collection];
            data.value = data.value.add(tx.value);

            const ethValue = ethers.utils.formatEther(data.value);
            data.eth_value = ethValue;
        }));
    }));

    const transfersByCollection = {};

    const collections = new Set(
        Object.keys(mintTxsByCollection).concat(Object.keys(tradesByCollection))
    );

    for (let collection of collections) {
        const data = tradesByCollection[collection];
        let sales = 0;
        let buys = 0;
        let mints = 0;

        if (data) {
            sales = parseFloat(data.total_sales_eth, 10);
            buys = parseFloat(data.total_buys_eth, 10);
        }

        if (mintTxsByCollection[collection]) {
            mints = parseFloat(mintTxsByCollection[collection].eth_value, 10);
        }

        transfersByCollection[collection] = {
            sales,
            buys,
            mints,
            investment: buys + mints,
            realized_roi: sales - buys - mints
        };
    }

    return transfersByCollection;
}
