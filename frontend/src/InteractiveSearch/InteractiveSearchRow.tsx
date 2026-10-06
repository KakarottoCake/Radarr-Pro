import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import ProtocolLabel from 'Activity/Queue/ProtocolLabel';
import Icon from 'Components/Icon';
import Button from 'Components/Link/Button';
import Link from 'Components/Link/Link';
import SpinnerButton from 'Components/Link/SpinnerButton';
import ConfirmModal from 'Components/Modal/ConfirmModal';
import { icons, kinds } from 'Helpers/Props';
import MovieFormats from 'Movie/MovieFormats';
import MovieLanguages from 'Movie/MovieLanguages';
import MovieQuality from 'Movie/MovieQuality';
import createUISettingsSelector from 'Store/Selectors/createUISettingsSelector';
import Release from 'typings/Release';
import formatDateTime from 'Utilities/Date/formatDateTime';
import formatAge from 'Utilities/Number/formatAge';
import formatBytes from 'Utilities/Number/formatBytes';
import formatCustomFormatScore from 'Utilities/Number/formatCustomFormatScore';
import translate from 'Utilities/String/translate';
import InteractiveSearchPayload from './InteractiveSearchPayload';
import OverrideMatchModal from './OverrideMatch/OverrideMatchModal';
import Peers from './Peers';
import styles from './InteractiveSearchRow.css';

function getDownloadKind(isGrabbed: boolean, grabError?: string) {
  if (isGrabbed) {
    return kinds.SUCCESS;
  }

  if (grabError) {
    return kinds.DANGER;
  }

  return kinds.PRIMARY;
}

function getDownloadTooltip(
  isGrabbing: boolean,
  isGrabbed: boolean,
  grabError?: string
) {
  if (isGrabbing) {
    return '';
  } else if (isGrabbed) {
    return translate('AddedToDownloadQueue');
  } else if (grabError) {
    return grabError;
  }

  return translate('AddToDownloadQueue');
}

interface InteractiveSearchRowProps extends Release {
  searchPayload: InteractiveSearchPayload;
  onGrabPress(...args: unknown[]): void;
}

function InteractiveSearchRow(props: InteractiveSearchRowProps) {
  const {
    guid,
    indexerId,
    protocol,
    age,
    ageHours,
    ageMinutes,
    publishDate,
    title,
    infoUrl,
    indexer,
    size,
    seeders,
    leechers,
    quality,
    history,
    languages,
    customFormatScore,
    customFormats,
    mappedMovieId,
    indexerFlags = [],
    rejections = [],
    downloadAllowed,
    isGrabbing = false,
    isGrabbed = false,
    grabError,
    searchPayload,
    onGrabPress,
  } = props;

  const { longDateFormat, timeFormat } = useSelector(
    createUISettingsSelector()
  );

  const [isConfirmGrabModalOpen, setIsConfirmGrabModalOpen] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);

  const isBlocklisted = useMemo(() => {
    return (
      rejections.findIndex((reason) =>
        reason.toLowerCase().includes('blocklisted')
      ) >= 0
    );
  }, [rejections]);

  const onGrabPressWrapper = useCallback(() => {
    if (downloadAllowed) {
      onGrabPress({
        guid,
        indexerId,
      });

      return;
    }

    setIsConfirmGrabModalOpen(true);
  }, [
    guid,
    indexerId,
    downloadAllowed,
    onGrabPress,
    setIsConfirmGrabModalOpen,
  ]);

  const onGrabConfirm = useCallback(() => {
    setIsConfirmGrabModalOpen(false);

    onGrabPress({
      guid,
      indexerId,
      ...searchPayload,
    });
  }, [guid, indexerId, searchPayload, onGrabPress, setIsConfirmGrabModalOpen]);

  const onGrabCancel = useCallback(() => {
    setIsConfirmGrabModalOpen(false);
  }, [setIsConfirmGrabModalOpen]);

  const onOverridePress = useCallback(() => {
    setIsOverrideModalOpen(true);
  }, [setIsOverrideModalOpen]);

  const onOverrideModalClose = useCallback(() => {
    setIsOverrideModalOpen(false);
  }, [setIsOverrideModalOpen]);

  let statusKey = 'InteractiveSearchReady';

  if (rejections.length) {
    statusKey = 'InteractiveSearchRejected';
  } else if (!downloadAllowed) {
    statusKey = 'InteractiveSearchNeedsMatch';
  }

  const isWarning = !!rejections.length || !downloadAllowed;

  return (
    <div className={styles.row}>
      <article className={styles.card} aria-label={title}>
        <div className={styles.content}>
          <Link className={styles.releaseTitle} to={infoUrl}>
            {title}
          </Link>

          <div className={styles.badges}>
            <ProtocolLabel protocol={protocol} />
            <MovieQuality quality={quality} showRevision={true} />
            <MovieLanguages languages={languages} />
            <span
              className={styles.score}
              title={translate('CustomFormatScore')}
            >
              <Icon name={icons.SCORE} size={12} />
              {translate('InteractiveSearchScore')}{' '}
              {formatCustomFormatScore(customFormatScore, customFormats.length)}
            </span>
          </div>

          <dl className={styles.metadata}>
            <div>
              <dt>{translate('Indexer')}</dt>
              <dd>{indexer}</dd>
            </div>
            <div>
              <dt>{translate('Size')}</dt>
              <dd>{formatBytes(size)}</dd>
            </div>
            <div>
              <dt>{translate('Age')}</dt>
              <dd
                title={formatDateTime(publishDate, longDateFormat, timeFormat, {
                  includeSeconds: true,
                })}
              >
                {formatAge(age, ageHours, ageMinutes)}
              </dd>
            </div>
            {protocol === 'torrent' ? (
              <div>
                <dt>{translate('Peers')}</dt>
                <dd>
                  <Peers seeders={seeders} leechers={leechers} />
                </dd>
              </div>
            ) : null}
          </dl>

          {history || isBlocklisted ? (
            <div className={styles.history}>
              {history ? (
                <span>
                  <Icon
                    name={icons.DOWNLOADING}
                    kind={history.failed ? kinds.DANGER : kinds.DEFAULT}
                  />
                  {history.failed
                    ? translate('FailedAt', {
                        date: formatDateTime(
                          history.failed,
                          longDateFormat,
                          timeFormat,
                          { includeSeconds: true }
                        ),
                      })
                    : translate('GrabbedAt', {
                        date: formatDateTime(
                          history.grabbed,
                          longDateFormat,
                          timeFormat,
                          { includeSeconds: true }
                        ),
                      })}
                </span>
              ) : null}

              {isBlocklisted ? (
                <span>
                  <Icon name={icons.BLOCKLIST} kind={kinds.DANGER} />
                  {translate('Blocklisted')}
                </span>
              ) : null}
            </div>
          ) : null}

          {rejections.length ? (
            <div className={styles.rejectionPreview}>{rejections[0]}</div>
          ) : null}

          {rejections.length || customFormats.length || indexerFlags.length ? (
            <details className={styles.details}>
              <summary>{translate('Details')}</summary>

              {rejections.length ? (
                <div className={styles.detailSection}>
                  <strong>
                    {translate('Rejections')} ({rejections.length})
                  </strong>
                  <ul className={styles.list}>
                    {rejections.map((rejection, index) => (
                      <li key={index}>{rejection}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {customFormats.length ? (
                <div className={styles.detailSection}>
                  <strong>{translate('CustomFormats')}</strong>
                  <div className={styles.formats}>
                    <MovieFormats formats={customFormats} />
                  </div>
                </div>
              ) : null}

              {indexerFlags.length ? (
                <div className={styles.detailSection}>
                  <strong>{translate('IndexerFlags')}</strong>
                  <ul className={styles.list}>
                    {indexerFlags.map((flag, index) => (
                      <li key={index}>{flag}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </details>
          ) : null}

          {grabError ? (
            <div className={styles.grabError} role="alert">
              {grabError}
            </div>
          ) : null}
        </div>

        <div className={styles.actions}>
          <span className={isWarning ? styles.rejected : styles.approved}>
            <Icon
              name={isWarning ? icons.DANGER : icons.CHECK_CIRCLE}
              size={14}
            />
            {translate(statusKey)}
          </span>

          <div className={styles.buttons}>
            <SpinnerButton
              className={styles.actionButton}
              kind={getDownloadKind(isGrabbed, grabError)}
              title={getDownloadTooltip(isGrabbing, isGrabbed, grabError)}
              aria-label={`${translate('Download')}: ${title}`}
              isSpinning={isGrabbing}
              isDisabled={isGrabbed}
              onPress={onGrabPressWrapper}
            >
              <Icon name={isGrabbed ? icons.CHECK : icons.DOWNLOAD} size={14} />{' '}
              {translate(isGrabbed ? 'Grabbed' : 'Download')}
            </SpinnerButton>

            <Button
              className={styles.actionButton}
              title={translate('OverrideAndAddToDownloadQueue')}
              isDisabled={isGrabbing || isGrabbed}
              onPress={onOverridePress}
            >
              <Icon name={icons.INTERACTIVE} size={14} />{' '}
              {translate('InteractiveSearchOverride')}
            </Button>
          </div>
        </div>
      </article>

      <ConfirmModal
        isOpen={isConfirmGrabModalOpen}
        kind={kinds.WARNING}
        title={translate('GrabRelease')}
        message={translate('GrabReleaseMessageText', { title })}
        confirmLabel={translate('Grab')}
        onConfirm={onGrabConfirm}
        onCancel={onGrabCancel}
      />

      <OverrideMatchModal
        isOpen={isOverrideModalOpen}
        title={title}
        indexerId={indexerId}
        guid={guid}
        movieId={mappedMovieId}
        languages={languages}
        quality={quality}
        protocol={protocol}
        isGrabbing={isGrabbing}
        grabError={grabError}
        onModalClose={onOverrideModalClose}
      />
    </div>
  );
}

export default InteractiveSearchRow;
