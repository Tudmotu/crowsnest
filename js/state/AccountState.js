import { AbstractStateComponent } from './AbstractStateComponent.js';

export class AccountStateComponent extends AbstractStateComponent {
    state = {};

    setAddress (address) {
        this.set({
            ...this.get(),
            address
        });
    }
}

export const AccountState = new AccountStateComponent();
