import { AbstractStateComponent } from './AbstractStateComponent.js';

export class GlobalErrorStateComponent extends AbstractStateComponent {
    state = "";
}

export const GlobalErrorState = new GlobalErrorStateComponent();
