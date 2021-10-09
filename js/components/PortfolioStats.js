import '../../node_modules/chart.js/dist/chart.js';
import '../../node_modules/chartjs-plugin-datalabels/dist/chartjs-plugin-datalabels.min.js';

window.Chart.register(window.ChartDataLabels);

export class PortfolioStats {
    constructor (el) {
        this.el = el;
    }

    getEl (selector) {
        return this.el.querySelector(selector);
    }

    renderPieChart (el, collections) {
        const bodyStyle = getComputedStyle(document.body);
        const textColor = bodyStyle.getPropertyValue('--c-white');
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
                            backgroundColor: colors
                        }
                    ]
                },
                plugins: [ChartDataLabels],
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right'
                        },
                        datalabels: {
                            color: textColor,
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

    async render (collectionsRequest) {
        const collections = await collectionsRequest;
        const ethLogo = `<img src="./eth.svg" class="ethLogo" />`;

        const totalOwned = collections.reduce((sum, curr) => sum + curr.owned_asset_count, 0);
        const totalMinVal = collections.reduce((sum, current) => {
            return sum + current.owned_asset_count * current.stats.floor_price;
        }, 0).toFixed(2);
        const totalAvgVal = collections.reduce((sum, current) => {
            return sum + current.owned_asset_count * current.stats.one_day_average_price;
        }, 0).toFixed(2);

        this.getEl('#statTotalOwned').querySelector('.statValue').textContent = totalOwned;
        this.getEl('#statMinValue').querySelector('.statValue').innerHTML = `${ethLogo}${totalMinVal}`;
        this.getEl('#statAvgValue').querySelector('.statValue').innerHTML = `${ethLogo}${totalAvgVal}`;
        this.getEl('#statCollections').querySelector('.statValue').textContent = collections.length;

        this.renderPieChart(this.getEl('#statCollectionPieChart'), collections);
    }
}
