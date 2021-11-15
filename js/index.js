import { App } from './components/App.js';
import * as analytics from './analytics.js';

const app = new App();

app.start().then(() => {
    console.log("Welcome to Crow's Nest!");
}).catch(e => {
    analytics.error(e.message);
});
