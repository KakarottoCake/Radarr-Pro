import React from 'react';
import { useLocation } from 'react-router';
import Icon, { IconName } from 'Components/Icon';
import Link from 'Components/Link/Link';
import BottomSheet from 'Components/Modal/BottomSheet';
import { icons } from 'Helpers/Props';
import translate from 'Utilities/String/translate';
import { LINKS } from './Sidebar/PageSidebar';
import styles from './MobileMoreSheet.css';

// Quick destinations shown as large tiles at the top of the sheet.
const TILES: { to: string; icon: IconName; title: string }[] = [
  { to: '/add/new', icon: icons.ADD, title: 'AddNew' },
  { to: '/add/discover', icon: icons.POPULAR, title: 'Discover' },
  { to: '/collections', icon: icons.GROUP, title: 'Collections' },
  { to: '/add/import', icon: icons.FOLDER_OPEN, title: 'ImportLibrary' },
];

const CHILD_ICONS: Record<string, IconName> = {
  '/activity/queue': icons.DOWNLOAD,
  '/activity/history': icons.HISTORY,
  '/activity/blocklist': icons.BLOCKLIST,
  '/wanted/missing': icons.MISSING,
  '/wanted/cutoffunmet': icons.WARNING,
  '/settings/mediamanagement': icons.FOLDER,
  '/settings/profiles': icons.PROFILE,
  '/settings/quality': icons.SCORE,
  '/settings/customformats': icons.FILTER,
  '/settings/indexers': icons.SEARCH,
  '/settings/downloadclients': icons.DOWNLOADING,
  '/settings/importlists': icons.ADD,
  '/settings/connect': icons.NETWORK,
  '/settings/metadata': icons.MEDIA_INFO,
  '/settings/tags': icons.TAGS,
  '/settings/general': icons.SETTINGS,
  '/settings/ui': icons.VIEW,
  '/system/status': icons.HEALTH,
  '/system/tasks': icons.SCHEDULED,
  '/system/backup': icons.BACKUP,
  '/system/updates': icons.UPDATE,
  '/system/events': icons.INFO,
  '/system/logs/files': icons.FILE,
};

// Movies and Calendar already live in the tab bar.
const GROUPS = LINKS.filter((link) => link.to !== '/' && link.children);

function getTitle(title: string | (() => string)) {
  return typeof title === 'function' ? title() : title;
}

interface MobileMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

function MobileMoreSheet({ isOpen, onClose }: MobileMoreSheetProps) {
  const { pathname } = useLocation();

  return (
    <BottomSheet
      isOpen={isOpen}
      title={translate('More')}
      onModalClose={onClose}
    >
      <div className={styles.tiles}>
        {TILES.map(({ to, icon, title }) => (
          <Link
            key={to}
            className={pathname === to ? styles.activeTile : styles.tile}
            to={to}
            onPress={onClose}
          >
            <span className={styles.tileIcon}>
              <Icon name={icon} size={20} />
            </span>
            <span className={styles.tileLabel}>{translate(title)}</span>
          </Link>
        ))}
      </div>

      {GROUPS.map((group) => (
        <section key={group.to} className={styles.group}>
          <h3 className={styles.groupTitle}>{getTitle(group.title)}</h3>

          <div className={styles.list}>
            {group.children!.map(
              ({ to, title, statusComponent: StatusComponent }) => (
                <Link
                  key={to}
                  className={pathname === to ? styles.activeRow : styles.row}
                  to={to}
                  onPress={onClose}
                >
                  <span className={styles.rowIcon}>
                    <Icon
                      name={CHILD_ICONS[to] ?? group.iconName ?? icons.INFO}
                      size={16}
                    />
                  </span>

                  <span className={styles.rowLabel}>{getTitle(title)}</span>

                  {StatusComponent ? (
                    <span className={styles.rowStatus}>
                      <StatusComponent />
                    </span>
                  ) : null}

                  <Icon
                    className={styles.chevron}
                    name={icons.CHEVRON_RIGHT}
                    size={12}
                  />
                </Link>
              )
            )}
          </div>
        </section>
      ))}
    </BottomSheet>
  );
}

export default MobileMoreSheet;
