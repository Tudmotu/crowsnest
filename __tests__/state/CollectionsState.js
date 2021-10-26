import { CollectionsStateComponent } from '../../js/state/CollectionsState.js';

describe('CollectionsState module', () => {
    let state;
    beforeEach(() => {
        state = new CollectionsStateComponent();
        state.set([
            {
                slug: 'collectionA'
            },
            {
                slug: 'collectionB'
            }
        ]);
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
