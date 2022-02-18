export class Component {
    ref (name) {
        return this.container.querySelector(`[data-ref="${name}"]`);
    }
}
