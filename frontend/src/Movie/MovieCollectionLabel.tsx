import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'Components/Link/Link';
import MonitorToggleButton from 'Components/MonitorToggleButton';
import { toggleCollectionMonitored } from 'Store/Actions/movieCollectionActions';
import { createCollectionSelectorForHook } from 'Store/Selectors/createCollectionSelector';
import MovieCollection from 'typings/MovieCollection';
import translate from 'Utilities/String/translate';
import styles from './MovieCollectionLabel.css';

interface MovieCollectionLabelProps {
  tmdbId: number;
}

function MovieCollectionLabel({ tmdbId }: MovieCollectionLabelProps) {
  const {
    id,
    monitored,
    title,
    isSaving = false,
  } = useSelector(createCollectionSelectorForHook(tmdbId)) ||
  ({} as MovieCollection);

  const dispatch = useDispatch();

  const handleMonitorTogglePress = useCallback(
    (value: boolean) => {
      dispatch(
        toggleCollectionMonitored({ collectionId: id, monitored: value })
      );
    },
    [id, dispatch]
  );

  if (!id) {
    return translate('Unknown');
  }

  return (
    <div>
      <MonitorToggleButton
        className={styles.monitorToggleButton}
        monitored={monitored}
        isSaving={isSaving}
        size={15}
        onPress={handleMonitorTogglePress}
      />
      <Link
        to={`/collections?collectionId=${id}`}
        title={translate('ViewCollection')}
      >
        {title}
      </Link>
    </div>
  );
}

export default MovieCollectionLabel;
