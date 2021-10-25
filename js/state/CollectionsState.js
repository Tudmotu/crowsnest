import { AbstractStateComponent } from './AbstractStateComponent.js';

export class CollectionsStateComponent extends AbstractStateComponent {
    getCollection (collection) {
        return this.state.find(c => c.collection_slug === collection);
    }

    async hide (collection) {
        this.getCollection(collection).hidden = true;
        await this.emitUpdate();
    }

    async unhide (collection) {
        this.getCollection(collection).hidden = false;
        await this.emitUpdate();
    }
}

export const CollectionsState = new CollectionsStateComponent();
