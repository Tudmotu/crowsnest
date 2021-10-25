import { AbstractStateComponent } from './AbstractStateComponent.js';

export class CollectionsStateComponent extends AbstractStateComponent {
    getCollection (collection) {
        return this.state.find(c => c.slug === collection);
    }

    getVisible () {
        return this.get().filter(c => c.hidden !== true);
    }

    isVisible (collection) {
        return !this.getCollection(collection)?.hidden;
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
