import { AbstractStateComponent } from './AbstractStateComponent.js';
import { CollectionsState } from './CollectionsState.js';

export class InvestmentsStateComponent extends AbstractStateComponent {
    getVisible () {
        const visibles = {};
        if (!this.state) return {};
        for (let [collection, stats] of Object.entries(this.get())) {
            if (CollectionsState.isVisible(collection)) {
                visibles[collection] = stats;
            }
        }

        return visibles;
    }
}

export const InvestmentsState = new InvestmentsStateComponent();
