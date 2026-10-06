import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ClientSideCollectionAppState from 'App/State/ClientSideCollectionAppState';
import ReleasesAppState from 'App/State/ReleasesAppState';
import Alert from 'Components/Alert';
import SelectInput from 'Components/Form/SelectInput';
import TextInput from 'Components/Form/TextInput';
import Icon from 'Components/Icon';
import Button from 'Components/Link/Button';
import LoadingIndicator from 'Components/Loading/LoadingIndicator';
import FilterMenu from 'Components/Menu/FilterMenu';
import PageMenuButton from 'Components/Menu/PageMenuButton';
import { align, icons, kinds, sortDirections } from 'Helpers/Props';
import {
  fetchReleases,
  grabRelease,
  setReleasesFilter,
  setReleasesSort,
} from 'Store/Actions/releaseActions';
import createClientSideCollectionSelector from 'Store/Selectors/createClientSideCollectionSelector';
import { InputChanged } from 'typings/inputs';
import Release from 'typings/Release';
import getErrorMessage from 'Utilities/Object/getErrorMessage';
import translate from 'Utilities/String/translate';
import InteractiveSearchFilterModal from './InteractiveSearchFilterModal';
import InteractiveSearchPayload from './InteractiveSearchPayload';
import InteractiveSearchRow from './InteractiveSearchRow';
import styles from './InteractiveSearch.css';

const SORT_OPTIONS = [
  {
    key: 'releaseWeight',
    get value() {
      return translate('InteractiveSearchRecommended');
    },
  },
  {
    key: 'customFormatScore',
    get value() {
      return translate('CustomFormatScore');
    },
  },
  {
    key: 'qualityWeight',
    get value() {
      return translate('Quality');
    },
  },
  {
    key: 'size',
    get value() {
      return translate('Size');
    },
  },
  {
    key: 'peers',
    get value() {
      return translate('Peers');
    },
  },
  {
    key: 'age',
    get value() {
      return translate('Age');
    },
  },
  {
    key: 'title',
    get value() {
      return translate('Title');
    },
  },
  {
    key: 'indexer',
    get value() {
      return translate('Indexer');
    },
  },
  {
    key: 'history',
    get value() {
      return translate('History');
    },
  },
  {
    key: 'protocol',
    get value() {
      return translate('Source');
    },
  },
  {
    key: 'languages',
    get value() {
      return translate('Languages');
    },
  },
  {
    key: 'indexerFlags',
    get value() {
      return translate('IndexerFlags');
    },
  },
  {
    key: 'rejections',
    get value() {
      return translate('Rejections');
    },
  },
];

const DESCENDING_BY_DEFAULT = ['customFormatScore', 'qualityWeight', 'peers'];

interface InteractiveSearchProps {
  searchPayload: InteractiveSearchPayload;
}

function InteractiveSearch({ searchPayload }: InteractiveSearchProps) {
  const {
    isFetching,
    isPopulated,
    error,
    items,
    totalItems,
    selectedFilterKey,
    filters,
    customFilters,
    sortKey,
    sortDirection,
  }: ReleasesAppState & ClientSideCollectionAppState = useSelector(
    createClientSideCollectionSelector('releases')
  );

  const dispatch = useDispatch();
  const [filterText, setFilterText] = useState('');

  const visibleItems = useMemo(() => {
    const terms = filterText.trim().toLowerCase().split(/\s+/).filter(Boolean);

    if (!terms.length) {
      return items as Release[];
    }

    return (items as Release[]).filter((item) => {
      const haystack = `${item.title} ${item.indexer}`.toLowerCase();

      return terms.every((term) => haystack.includes(term));
    });
  }, [items, filterText]);

  const handleFilterSelect = useCallback(
    (selectedFilterKey: string | number) => {
      dispatch(setReleasesFilter({ selectedFilterKey }));
    },
    [dispatch]
  );

  const handleFilterTextChange = useCallback(
    ({ value }: InputChanged<string>) => {
      setFilterText(value);
    },
    []
  );

  const handleSortChange = useCallback(
    ({ value }: InputChanged<string>) => {
      dispatch(
        setReleasesSort({
          sortKey: value,
          sortDirection: DESCENDING_BY_DEFAULT.includes(value)
            ? sortDirections.DESCENDING
            : sortDirections.ASCENDING,
        })
      );
    },
    [dispatch]
  );

  const handleSortDirectionPress = useCallback(() => {
    dispatch(
      setReleasesSort({
        sortKey,
        sortDirection:
          sortDirection === sortDirections.ASCENDING
            ? sortDirections.DESCENDING
            : sortDirections.ASCENDING,
      })
    );
  }, [sortKey, sortDirection, dispatch]);

  const handleGrabPress = useCallback(
    (payload: object) => {
      dispatch(grabRelease(payload));
    },
    [dispatch]
  );

  useEffect(
    () => {
      // Only fetch releases if they are not already being fetched and not yet populated.

      if (!isFetching && !isPopulated) {
        dispatch(fetchReleases(searchPayload));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const errorMessage = getErrorMessage(error);
  const isAscending = sortDirection === sortDirections.ASCENDING;
  const sortDirectionLabel = translate(
    isAscending ? 'InteractiveSearchAscending' : 'InteractiveSearchDescending'
  );

  return (
    <div className={styles.search}>
      <div className={styles.toolbar}>
        <div className={styles.filterRow}>
          <label className={styles.filterInput}>
            <span className={styles.srOnly}>
              {translate('FilterReleasesPlaceholder')}
            </span>

            <TextInput
              name="releaseFilter"
              value={filterText}
              placeholder={translate('FilterReleasesPlaceholder')}
              onChange={handleFilterTextChange}
            />
          </label>

          <FilterMenu
            alignMenu={align.RIGHT}
            selectedFilterKey={selectedFilterKey}
            filters={filters}
            customFilters={customFilters}
            buttonComponent={PageMenuButton}
            filterModalConnectorComponent={InteractiveSearchFilterModal}
            filterModalConnectorComponentProps={{ type: 'movies' }}
            onFilterSelect={handleFilterSelect}
          />
        </div>

        <div className={styles.sortRow}>
          <span className={styles.resultCount} role="status" aria-live="polite">
            {isFetching
              ? translate('Searching')
              : translate('InteractiveSearchResultsCount', {
                  count: visibleItems.length,
                  total: totalItems,
                })}
          </span>

          <label className={styles.sortInput}>
            <span>{translate('Sort')}</span>

            <SelectInput
              name="releaseSort"
              value={sortKey}
              values={SORT_OPTIONS}
              onChange={handleSortChange}
            />
          </label>

          <Button
            className={styles.directionButton}
            title={sortDirectionLabel}
            aria-label={sortDirectionLabel}
            onPress={handleSortDirectionPress}
          >
            <Icon
              name={isAscending ? icons.SORT_ASCENDING : icons.SORT_DESCENDING}
            />
          </Button>
        </div>
      </div>

      {isFetching ? <LoadingIndicator /> : null}

      {!isFetching && error ? (
        <Alert kind={kinds.DANGER} className={styles.alert}>
          {errorMessage ? (
            <>
              {translate('InteractiveSearchResultsFailedErrorMessage', {
                message:
                  errorMessage.charAt(0).toLowerCase() + errorMessage.slice(1),
              })}
            </>
          ) : (
            translate('MovieSearchResultsLoadError')
          )}
        </Alert>
      ) : null}

      {!isFetching && isPopulated && !totalItems ? (
        <Alert kind={kinds.INFO} className={styles.alert}>
          {translate('NoResultsFound')}
        </Alert>
      ) : null}

      {!!totalItems && isPopulated && !visibleItems.length ? (
        <Alert kind={kinds.WARNING} className={styles.alert}>
          {translate('AllResultsHiddenFilter')}
        </Alert>
      ) : null}

      {isPopulated && !!visibleItems.length ? (
        <div className={styles.results}>
          {visibleItems.map((item) => {
            return (
              <InteractiveSearchRow
                key={`${item.indexerId}-${item.guid}`}
                {...item}
                searchPayload={searchPayload}
                onGrabPress={handleGrabPress}
              />
            );
          })}
        </div>
      ) : null}

      {totalItems !== visibleItems.length && !!visibleItems.length ? (
        <Alert kind={kinds.INFO} className={styles.alert}>
          {translate('SomeResultsHiddenFilter')}
        </Alert>
      ) : null}
    </div>
  );
}

export default InteractiveSearch;
