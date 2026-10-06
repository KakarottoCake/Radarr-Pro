import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import Icon from 'Components/Icon';
import Link from 'Components/Link/Link';
import { icons } from 'Helpers/Props';
import createDimensionsSelector from 'Store/Selectors/createDimensionsSelector';
import translate from 'Utilities/String/translate';
import MobileMoreSheet from './MobileMoreSheet';
import styles from './MobileNavigation.css';

export const MOBILE_NAVIGATION_MORE_ID = 'mobile-navigation-more';

const LINKS = [
  {
    to: '/',
    icon: icons.FILM,
    title: 'Movies',
    matches: (path: string) => path === '/' || path.startsWith('/movie/'),
  },
  {
    to: '/calendar',
    icon: icons.CALENDAR,
    title: 'Calendar',
    matches: (path: string) => path.startsWith('/calendar'),
  },
  {
    to: '/wanted/missing',
    icon: icons.WARNING,
    title: 'Wanted',
    matches: (path: string) => path.startsWith('/wanted'),
  },
  {
    to: '/activity/queue',
    icon: icons.DOWNLOAD,
    title: 'Queue',
    matches: (path: string) => path.startsWith('/activity/queue'),
  },
];

function MobileNavigation() {
  const { isSmallScreen } = useSelector(createDimensionsSelector());
  const { pathname } = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const handleMorePress = useCallback(() => {
    setIsMoreOpen((isOpen) => !isOpen);
  }, []);

  const handleMoreClose = useCallback(() => {
    setIsMoreOpen(false);
  }, []);

  useEffect(() => {
    // Navigating anywhere (including back/forward) dismisses the sheet.
    setIsMoreOpen(false);
  }, [pathname]);

  if (!isSmallScreen) {
    return null;
  }

  const hasActiveLink = LINKS.some(({ matches }) => matches(pathname));
  const isMoreActive = isMoreOpen || !hasActiveLink;

  return (
    <>
      <nav
        className={styles.navigation}
        aria-label={translate('MainNavigation')}
      >
        {LINKS.map(({ to, icon, title, matches }) => {
          const isActive = !isMoreOpen && matches(pathname);

          return (
            <Link
              key={to}
              className={classNames(styles.button, isActive && styles.active)}
              to={to}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={styles.iconPill}>
                <Icon name={icon} size={18} />
              </span>
              <span className={styles.label}>{translate(title)}</span>
            </Link>
          );
        })}

        <Link
          id={MOBILE_NAVIGATION_MORE_ID}
          className={classNames(styles.button, isMoreActive && styles.active)}
          aria-label={translate('More')}
          aria-expanded={isMoreOpen}
          aria-haspopup="dialog"
          onPress={handleMorePress}
        >
          <span className={styles.iconPill}>
            <Icon name={icons.NAVBAR_COLLAPSE} size={18} />
          </span>
          <span className={styles.label}>{translate('More')}</span>
        </Link>
      </nav>

      <MobileMoreSheet isOpen={isMoreOpen} onClose={handleMoreClose} />
    </>
  );
}

export default MobileNavigation;
