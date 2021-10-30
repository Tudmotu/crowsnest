import { CollectionsStateComponent } from '../../js/state/CollectionsState.js';
import { AccountStateComponent } from '../../js/state/AccountState.js';

describe('CollectionsState module', () => {
    let state;
    let account;
    beforeEach(async () => {
        account = new AccountStateComponent();
        account.setAddress(`aaa${Math.random()}`);

        state = new CollectionsStateComponent(account);
        await state.set([
            {
                slug: 'collectionA'
            },
            {
                slug: 'collectionB'
            }
        ]);
    });

    test('should persist unhiding collections', async () => {
        state = new CollectionsStateComponent(account);

        await state.set([
            { slug: 'collectionA' }
        ]);

        state.hide('collectionA');
        state.unhide('collectionA');

        jest.resetModules();
        const RESET_MODULE = require('../../js/state/CollectionsState.js');
        const newState = new RESET_MODULE.CollectionsStateComponent(account);

        await newState.set([
            { slug: 'collectionA' }
        ]);

        expect(newState.isVisible('collectionA')).toBe(true);
    });

    test('should support hiding 3 collections', async () => {
        state = new CollectionsStateComponent(account);

        await state.set([
            { slug: 'collectionA' },
            { slug: 'collectionB' },
            { slug: 'collectionC' }
        ]);

        state.hide('collectionA');
        state.hide('collectionB');
        state.hide('collectionC');

        jest.resetModules();
        const RESET_MODULE = require('../../js/state/CollectionsState.js');
        const newState = new RESET_MODULE.CollectionsStateComponent(account);

        await newState.set([
            { slug: 'collectionA' },
            { slug: 'collectionB' },
            { slug: 'collectionC' }
        ]);

        expect(newState.isVisible('collectionA')).toBe(false);
        expect(newState.isVisible('collectionB')).toBe(false);
        expect(newState.isVisible('collectionC')).toBe(false);
    });

    test('.get() should return empty array if no state is set', async () => {
        state = new CollectionsStateComponent(account);
        expect(state.get()).toStrictEqual([]);
    });

    test('.hide() should persist to localStorage', async () => {
        account = new AccountStateComponent();
        account.setAddress('persistent_hidden_test');

        const oldState = new CollectionsStateComponent(account);

        await oldState.set(Promise.resolve([
            {
                slug: 'collectionA'
            },
            {
                slug: 'collectionB'
            }
        ]));

        oldState.hide('collectionA')

        jest.resetModules();

        const RESET_MODULE = require('../../js/state/CollectionsState.js');

        const newState = new RESET_MODULE.CollectionsStateComponent(account);

        await newState.set(Promise.resolve([
            {
                slug: 'collectionA'
            },
            {
                slug: 'collectionB'
            }
        ]));

        expect(newState.isVisible('collectionA')).toBe(false);

        const key = 'hidden_collections_persistent_hidden_test';
        expect(localStorage[key]).toBe('["collectionA"]');
    });

    test('.isVisible() should return false if hidden=true', () => {
        state.hide('collectionA');
        expect(state.isVisible('collectionA')).toBe(false);
    });

    test('.isVisible() should return true if hidden=false', () => {
        expect(state.isVisible('collectionA')).toBe(true);
    });

    test('.getVisible() should return only visible collections', () => {
        state.hide('collectionA');
        expect(state.getVisible()).toStrictEqual([
            {
                slug: 'collectionB'
            }
        ]);
    });

    test('should invoke subscriber when unhiding', () => {
        const spy = jest.fn();
        state.subscribe(spy);
        state.unhide('collectionA');
        expect(spy).toHaveBeenCalled();
    });

    test('should invoke subscriber when hiding', () => {
        const spy = jest.fn();
        state.subscribe(spy);
        state.hide('collectionA');
        expect(spy).toHaveBeenCalled();
    });

    test('.unhide() should set hidden=false to collection', () => {
        state.hide('collectionA');
        state.unhide('collectionA');
        expect(state.get()).toStrictEqual([
            {
                slug: 'collectionA',
                hidden: false
            },
            {
                slug: 'collectionB'
            }
        ]);
    });

    test('.hide() should add hidden=true to collection', () => {
        state.hide('collectionA');
        expect(state.get()).toStrictEqual([
            {
                slug: 'collectionA',
                hidden: true
            },
            {
                slug: 'collectionB'
            }
        ]);
    });
});
