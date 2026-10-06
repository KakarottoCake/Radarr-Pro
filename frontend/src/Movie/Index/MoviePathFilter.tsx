import React, { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AppState from 'App/State/AppState';
import SelectInput from 'Components/Form/SelectInput';
import Button from 'Components/Link/Button';
import { setMoviePathFilter } from 'Store/Actions/movieIndexActions';
import { fetchRootFolders } from 'Store/Actions/rootFolderActions';
import { InputChanged } from 'typings/inputs';
import translate from 'Utilities/String/translate';
import styles from './MovieIndex.css';

interface MoviePathFilterProps {
  count: number;
  total: number;
}

export default function MoviePathFilter({
  count,
  total,
}: MoviePathFilterProps) {
  const dispatch = useDispatch();
  const pathFilter = useSelector(
    (state: AppState) => state.movieIndex.pathFilter ?? ''
  );
  const movies = useSelector((state: AppState) => state.movies);
  const rootFolders = useSelector((state: AppState) => state.rootFolders);

  useEffect(() => {
    if (!rootFolders.isPopulated && !rootFolders.isFetching) {
      dispatch(fetchRootFolders());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const paths = useMemo(() => {
    const folders = new Set(rootFolders.items.map((folder) => folder.path));

    for (const movie of movies.items) {
      const parent = movie.path?.replace(/[\\/][^\\/]+[\\/]?$/, '');

      if (parent) {
        folders.add(parent);
      }
    }

    // Include the mounted drives as well as their individual library folders.
    for (const path of [...folders]) {
      const mount = path.match(/^\/(?:mnt|media)\/[^/]+/);
      const drive = path.match(/^[A-Za-z]:[\\/]/);
      const match = mount ?? drive;

      if (match) {
        folders.add(match[0]);
      }
    }

    return [...folders].sort((a, b) => a.localeCompare(b));
  }, [movies.items, rootFolders.items]);

  const values = useMemo(
    () => [
      { key: '', value: translate('AllPaths') },
      ...paths.map((path) => ({ key: path, value: path })),
    ],
    [paths]
  );

  useEffect(() => {
    // A folder that no longer exists must not leave an invisible filter behind the picker.
    if (
      movies.isPopulated &&
      rootFolders.isPopulated &&
      pathFilter &&
      !paths.includes(pathFilter)
    ) {
      dispatch(setMoviePathFilter({ pathFilter: '' }));
    }
  }, [
    movies.isPopulated,
    rootFolders.isPopulated,
    pathFilter,
    paths,
    dispatch,
  ]);

  const handleChange = useCallback(
    ({ value }: InputChanged<string>) => {
      dispatch(setMoviePathFilter({ pathFilter: value }));
    },
    [dispatch]
  );

  const handleClear = useCallback(() => {
    dispatch(setMoviePathFilter({ pathFilter: '' }));
  }, [dispatch]);

  if (paths.length < 2 && !pathFilter) {
    return null;
  }

  return (
    <div className={styles.pathFilter}>
      <label className={styles.pathFilterPicker}>
        <span className={styles.pathFilterLabel}>
          {translate('FilterByPath')}
        </span>

        <SelectInput
          name="movie-path-filter"
          value={pathFilter}
          values={values}
          onChange={handleChange}
        />
      </label>

      {pathFilter ? (
        <Button onPress={handleClear}>{translate('Clear')}</Button>
      ) : null}

      <span className={styles.pathFilterCount}>
        {count} / {total}
      </span>
    </div>
  );
}
