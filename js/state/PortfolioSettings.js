import { AbstractStateComponent } from './AbstractStateComponent.js';

export class PortfolioSettingsComponent extends AbstractStateComponent {
    state = {};

    toggleHidden (showHidden) {
        this.set({
            ...this.get(),
            showHidden
        });
    }
}

export const PortfolioSettings = new PortfolioSettingsComponent();
