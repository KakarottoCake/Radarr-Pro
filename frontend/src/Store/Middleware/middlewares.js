import { routerMiddleware } from 'connected-react-router';
import { applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import createPersistState from './createPersistState';

export default function(history) {
  const middlewares = [];

  // Radarr Pro does not report browser errors to Sentry. Upstream sends them to
  // sentry.servarr.com, where errors from a fork's modified code would describe bugs
  // the Radarr team cannot reproduce or fix.
  middlewares.push(routerMiddleware(history));
  middlewares.push(thunk);

  // eslint-disable-next-line no-underscore-dangle
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

  return composeEnhancers(
    applyMiddleware(...middlewares),
    createPersistState()
  );
}
