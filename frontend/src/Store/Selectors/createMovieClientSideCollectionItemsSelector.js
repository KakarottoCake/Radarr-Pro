import { createSelector, createSelectorCreator, defaultMemoize } from 'reselect';
import hasDifferentItemsOrOrder from 'Utilities/Object/hasDifferentItemsOrOrder';
import createClientSideCollectionSelector from './createClientSideCollectionSelector';

function normalizePath(path) {
  return (path || '').replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
}

function isInPath(moviePath, selectedPath) {
  const path = normalizePath(moviePath);

  return path === selectedPath || path.startsWith(`${selectedPath}/`);
}

function createUnoptimizedSelector(uiSection) {
  return createSelector(
    createClientSideCollectionSelector('movies', uiSection),
    (movies) => {
      const selectedPath = normalizePath(movies.pathFilter);

      const filteredItems = selectedPath ?
        movies.items.filter((m) => isInPath(m.path, selectedPath)) :
        movies.items;

      const items = filteredItems.map((s) => {
        const {
          id,
          sortTitle,
          collectionId
        } = s;

        return {
          id,
          sortTitle,
          collectionId
        };
      });

      return {
        ...movies,
        items
      };
    }
  );
}

function movieListEqual(a, b) {
  return hasDifferentItemsOrOrder(a, b);
}

const createMovieEqualSelector = createSelectorCreator(
  defaultMemoize,
  movieListEqual
);

function createMovieClientSideCollectionItemsSelector(uiSection) {
  return createMovieEqualSelector(
    createUnoptimizedSelector(uiSection),
    (movies) => movies
  );
}

export default createMovieClientSideCollectionItemsSelector;
