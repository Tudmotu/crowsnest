import { ethers, BigNumber } from '../../node_modules/ethers/dist/ethers.esm.js';
import * as opensea from '../opensea.js';

const { formatEther } = ethers.utils;

async function calculateTxGasPaid (txHash, provider) {
    const receipt = await provider.getTransactionReceipt(txHash);
    return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}

export async function getInvestmentStats (address, provider) {
    const trades = await opensea.getTrades(address);

    const ethTrades = trades.filter(t => {
        return t.payment_token.symbol === 'ETH';
    });

    const tradesByCollection = {};

    for (let trade of ethTrades) {
        const collection = trade.collection_slug;
        const ethPrice = formatEther(trade.total_price);

        if (!tradesByCollection[collection]) {
            tradesByCollection[collection] = {
                buys: [],
                sales: [],
                total_buys: BigNumber.from('0'),
                total_sales: BigNumber.from('0')
            };
        }

        const collectionData = tradesByCollection[collection];

        if (trade.seller?.address.toLowerCase() === address.toLowerCase()) {
            collectionData.sales.push(trade);
            collectionData.total_sales = collectionData.total_sales.add(BigNumber.from(trade.total_price));
        }
        else {
            collectionData.buys.push(trade);
            collectionData.total_buys = collectionData.total_buys.add(BigNumber.from(trade.total_price));
        }
    }

    for (let data of Object.values(tradesByCollection)) {
        data.total_buys_eth = formatEther(data.total_buys);
        data.total_sales_eth = formatEther(data.total_sales);
        data.total_gas_paid = BigNumber.from('0');
        data.total_fees_paid = BigNumber.from('0');

        for (let sale of data.sales) {
            const asset = sale.asset?.asset_contract;
            const feePoints = BigNumber.from(asset?.seller_fee_basis_points ?? '0');
            const totalPrice = BigNumber.from(sale.total_price);
            const fee = totalPrice.mul(feePoints).div(1e4);
            data.total_fees_paid = data.total_fees_paid.add(fee);
        }

        for (let buy of data.buys) {
            const txHash = buy.transaction.transaction_hash;
            const gasPaid = await calculateTxGasPaid(txHash, provider);
            data.total_gas_paid = data.total_gas_paid.add(gasPaid);
        }
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
                gasPaid: BigNumber.from('0'),
                value: BigNumber.from('0')
            };
        }

        if (mint.transaction === null) continue;

        const txHash = mint.transaction.transaction_hash;
        mintTxsByCollection[collection].txs.add(txHash);
    }

    await Promise.all(Object.entries(mintTxsByCollection).map(([collection, collectionData]) => {
        return Promise.all([...collectionData.txs].map(async hash => {
            const tx = await provider.getTransaction(hash);
            const gasCost = await calculateTxGasPaid(hash, provider);
            const data = mintTxsByCollection[collection];
            data.value = data.value.add(tx.value);
            data.gasPaid = data.gasPaid.add(gasCost);

            const ethValue = formatEther(data.value);
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
        let gasPaid = data?.total_gas_paid ?? BigNumber.from('0');
        let feesPaid = data?.total_fees_paid ?? BigNumber.from('0');

        if (data) {
            sales = parseFloat(data.total_sales_eth, 10);
            buys = parseFloat(data.total_buys_eth, 10);
        }

        if (mintTxsByCollection[collection]) {
            mints = parseFloat(mintTxsByCollection[collection].eth_value, 10);
            gasPaid = gasPaid.add(mintTxsByCollection[collection].gasPaid);
        }

        transfersByCollection[collection] = {
            sales,
            buys,
            mints,
            gasPaid: parseFloat(formatEther(gasPaid), 10),
            feesPaid: parseFloat(formatEther(feesPaid), 10),
            investment: buys + mints,
            realized_roi: sales - buys - mints - parseFloat(formatEther(gasPaid), 10) - parseFloat(formatEther(feesPaid), 10)
        };
    }

    return transfersByCollection;
}
