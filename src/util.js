export function simpleEquals(first, second) {
  for (const key in first) {
    if (first[key] !== second[key]) return false;
  }
  return true;
}

export function select(keys) {
  keys = Array.isArray(keys) ? keys : keys.split(/\s*,\s*/);
  return state => Object.fromEntries(keys.map(key => [key, state[key]]));
}

export function mapActions(actions, store) {
  if (typeof actions == 'function') actions = actions(store);
  return Object.fromEntries(
    Object.entries(actions).map(([name, action]) => [
      name,
      store.bindAction(action),
    ])
  );
}
