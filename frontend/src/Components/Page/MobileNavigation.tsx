import classNames from 'classnames';
import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import AppState from 'App/State/AppState';
import Icon from 'Components/Icon';
import Link from 'Components/Link/Link';
import { icons } from 'Helpers/Props';
import { setIsSidebarVisible } from 'Store/Actions/appActions';
import createDimensionsSelector from 'Store/Selectors/createDimensionsSelector';
import translate from 'Utilities/String/translate';
import styles from './MobileNavigation.css';

export const MOBILE_NAVIGATION_MORE_ID = 'mobile-navigation-more';

const LINKS = [
  {
    to: '/',
    icon: icons.FILM,
    title: 'Movies',
    matches: (path: string) =>
      path === '/' ||
      path.startsWith('/movie/') ||
      path.startsWith('/add/') ||
      path.startsWith('/collections'),
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
  const dispatch = useDispatch();
  const { isSmallScreen } = useSelector(createDimensionsSelector());
  const isSidebarVisible = useSelector(
    (state: AppState) => state.app.isSidebarVisible
  );
  const { pathname } = useLocation();

  const handleMorePress = useCallback(() => {
    dispatch(setIsSidebarVisible({ isSidebarVisible: !isSidebarVisible }));
  }, [isSidebarVisible, dispatch]);

  if (!isSmallScreen) {
    return null;
  }

  const hasActiveLink = LINKS.some(({ matches }) => matches(pathname));

  return (
    <nav className={styles.navigation} aria-label={translate('MainNavigation')}>
      {LINKS.map(({ to, icon, title, matches }) => {
        const isActive = !isSidebarVisible && matches(pathname);

        return (
          <Link
            key={to}
            className={classNames(styles.button, isActive && styles.active)}
            to={to}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon name={icon} size={20} />
            <span className={styles.label}>{translate(title)}</span>
          </Link>
        );
      })}

      <Link
        id={MOBILE_NAVIGATION_MORE_ID}
        className={classNames(
          styles.button,
          (isSidebarVisible || !hasActiveLink) && styles.active
        )}
        aria-label={translate('More')}
        aria-expanded={isSidebarVisible}
        onPress={handleMorePress}
      >
        <Icon name={icons.NAVBAR_COLLAPSE} size={20} />
        <span className={styles.label}>{translate('More')}</span>
      </Link>
    </nav>
  );
}

export default MobileNavigation;
