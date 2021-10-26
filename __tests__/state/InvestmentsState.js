import { CollectionsStateComponent } from '../../js/state/CollectionsState.js';
import { InvestmentsStateComponent } from '../../js/state/InvestmentsState.js';

describe('InvestmentsState module', () => {
    let collections;
    let investments;
    beforeEach(() => {
        collections = new CollectionsStateComponent();

        collections.set([
            {
                slug: 'collectionA'
            },
            {
                slug: 'collectionB'
            }
        ]);

        investments = new InvestmentsStateComponent(collections);

        investments.set({
            collectionA: {},
            collectionB: {}
        });
    });

    test('.getVisible() should return empty object if state is null', () => {
        investments = new InvestmentsStateComponent(collections);
        expect(investments.getVisible()).toStrictEqual({});
    });

    test('.getVisible() should not return hidden collections', () => {
        collections.hide('collectionA');
        expect(investments.getVisible()).toStrictEqual({
            collectionB: {}
        });
    });

    test('.getVisible() should return all collections if none are hidden', () => {
        expect(investments.getVisible()).toStrictEqual({
            collectionA: {},
            collectionB: {}
        });
    });
});
