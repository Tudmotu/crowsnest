function copyObject (object) {
    return JSON.parse(JSON.stringify(object));
}

export class AbstractStateComponent {
    state = null;
    listeners = [];

    async set (newState) {
        this.state = copyObject(await newState);
        await this.emitUpdate();
    }

    get () {
        return copyObject(this.state);
    }

    async emitUpdate () {
        for (let listener of this.listeners) {
            await listener();
        }
    }

    subscribe (listener) {
        this.listeners.push(listener);
    }

    unsubscribe (listener) {
        this.listeners.splice(this.listeners.indexOf(listener), 1);
    }
};
