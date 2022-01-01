import '../../node_modules/chart.js/dist/chart.js';
import '../../node_modules/chartjs-plugin-datalabels/dist/chartjs-plugin-datalabels.min.js';

window.Chart.register(window.ChartDataLabels);

export class PortfolioStats {
    constructor (el, investmentsState, collectionsState) {
        this.el = el;
        this.collectionsState = collectionsState;
        this.investmentsState = investmentsState;

        collectionsState.subscribe(async () => {
            this.renderCollectionsStats(collectionsState.getVisible());
            this.renderRoiStats(investmentsState.getVisible(), collectionsState.getVisible());
        });

        investmentsState.subscribe(async () => {
            const state = investmentsState.get();

            if (Object.keys(state).length === 0) {
                this.resetStats();
            }
            else {
                await this.renderRoiStats(
                    investmentsState.getVisible(),
                    collectionsState.getVisible()
                );
            }
        });
    }

    getEl (selector) {
        return this.el.querySelector(selector);
    }

    renderPieChart (el, collections) {
        if (this.renderingPaused) return;

        const bodyStyle = getComputedStyle(document.body);
        const textColor = '#fff';
        const c1 = bodyStyle.getPropertyValue('--c-blue-grey');
        const c2 = bodyStyle.getPropertyValue('--c-light');
        const c3 = bodyStyle.getPropertyValue('--c-secondary');
        const c4 = bodyStyle.getPropertyValue('--c-main');
        const c5 = bodyStyle.getPropertyValue('--c-black');
        const colors = [c1, c2, c3, c4, c5];

        const collectionsOrderedByVal = collections.sort((a, b) =>{
            const aVal = a.owned_asset_count * a.stats.floor_price;
            const bVal = b.owned_asset_count * b.stats.floor_price;
            return bVal - aVal;
        });

        const topFourCollections = collectionsOrderedByVal.slice(0, 4);
        const otherCollections = collectionsOrderedByVal.slice(4);

        const labels = topFourCollections.map(c => c.name);
        labels.push('Others');

        const series = topFourCollections.map(c => {
            return c.owned_asset_count * c.stats.floor_price;
        });

        series.push(otherCollections.reduce((sum, c) => {
            return sum + (c.owned_asset_count * c.stats.floor_price);
        }, 0));

        if (this.statPieChartInstance) {
            this.statPieChartInstance.data = {
                labels,
                datasets: [
                    {
                        label: 'Collections',
                        data: series,
                        backgroundColor: colors
                    }
                ]
            };
            this.statPieChartInstance.update();
        }
        else {
            this.statPieChartInstance = new Chart(this.getEl('#statCollectionPieChart'), {
                type: 'pie',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Collections',
                            data: series,
                            backgroundColor: colors,
                            borderWidth: 0
                        }
                    ]
                },
                plugins: [ChartDataLabels],
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: textColor
                            },
                            position: 'right'
                        },
                        datalabels: {
                            color: textColor,
                            lineWidth: 0,
                            formatter: (value, context) => `Ξ${value.toFixed(2)}`,
                            font: {
                                family: '"Fira Sans"',
                                size: 16
                            }
                        }
                    }
                }
            });
        }
    }

    resetStats () {
        if (this.renderingPaused) return;

        this.getEl('#statTotalOwned').querySelector('.statValue').textContent = '--';
        this.getEl('#statMinValue').querySelector('.statValue').textContent = '--';
        this.getEl('#statAvgValue').querySelector('.statValue').textContent = '--';
        this.getEl('#statCollections').querySelector('.statValue').textContent = '--';
        this.getEl('#statPossibleROI').querySelector('.statValue').textContent = '--';
        this.getEl('#statTotalInvestment').querySelector('.statValue').textContent = '--';
    }

    async renderCollectionsStats (collections) {
        if (this.renderingPaused) return;

        const ethLogo = `<img src="./eth.svg" class="ethLogo" />`;

        const totalOwned = collections.reduce((sum, curr) => sum + curr.owned_asset_count, 0);
        const totalMinVal = collections.reduce((sum, current) => {
            return sum + current.owned_asset_count * current.stats.floor_price;
        }, 0);
        const totalAvgVal = collections.reduce((sum, current) => {
            return sum + current.owned_asset_count * current.stats.one_day_average_price;
        }, 0);

        this.getEl('#statTotalOwned').querySelector('.statValue').textContent = totalOwned;
        this.getEl('#statMinValue').querySelector('.statValue').innerHTML = `${ethLogo}${totalMinVal.toFixed(2)}`;
        this.getEl('#statAvgValue').querySelector('.statValue').innerHTML = `${ethLogo}${totalAvgVal.toFixed(2)}`;
        this.getEl('#statCollections').querySelector('.statValue').textContent = collections.length;

        this.renderPieChart(this.getEl('#statCollectionPieChart'), collections);
    }

    async renderRoiStats (investmentStats, collections) {
        if (this.renderingPaused) return;

        const ethLogo = `<img src="./eth.svg" class="ethLogo" />`;

        if (Object.keys(investmentStats).length === 0) return;

        const totalMinVal = collections.reduce((sum, current) => {
            return sum + current.owned_asset_count * current.stats.floor_price;
        }, 0);

        const totalInvestment = Object.values(investmentStats)
            .reduce((s, x) => s + (x.investment || 0), 0);

        const totalSales = Object.values(investmentStats)
            .reduce((s, x) => s + (x.sales || 0), 0);

        const totalGasPaid = Object.values(investmentStats)
            .reduce((s, x) => s + (x.gasPaid || 0), 0);

        const totalFeesPaid = Object.values(investmentStats)
            .reduce((s, x) => s + (x.feesPaid || 0), 0);

        const possibleROI =
            (totalMinVal + totalSales)
            -
            (totalInvestment + totalGasPaid + totalFeesPaid);

        this.getEl('#statPossibleROI').querySelector('.statValue').innerHTML = `${ethLogo}${possibleROI > 0 ? '+' : ''}${possibleROI.toFixed(2)}`;
        this.getEl('#statTotalInvestment').querySelector('.statValue').innerHTML = `${ethLogo}${totalInvestment.toFixed(2)}`;

        const roiSign = possibleROI > 0 ? 'positive' : 'negative';
        this.getEl('#statPossibleROI').dataset.roi = roiSign;
    }

    pauseRendering () {
        this.renderingPaused = true;
    }

    async resumeRendering () {
        this.renderingPaused = false;

        this.renderCollectionsStats(this.collectionsState.getVisible());

        this.renderRoiStats(
            this.investmentsState.getVisible(),
            this.collectionsState.getVisible()
        );
    }
}
