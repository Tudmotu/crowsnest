export class ErrorToast {
    constructor (state) {
        state.subscribe(() => {
            const message = state.get();
            if (message) {
                this.show(message);
            }
            else {
                this.remove(message);
            }
        });
    }

    show (message) {
        this.element = document.createElement('div');
        this.element.classList.add('errorToast');
        this.element.innerHTML = `
            ${message}
        `;
        document.body.appendChild(this.element);
    }

    remove () {
        document.body.removeChild(this.element);
        this.element = null;
    }
}
