import { simpleEquals, select, mapActions } from './util.js';

export function createStore(state = {}) {
  const listeners = new Map();

  function subscribe(setter, filter) {
    listeners.set(setter, filter);
  }

  function unsubscribe(setter) {
    listeners.delete(setter);
  }

  function getState() {
    return state;
  }

  function setState(newState, action) {
    const lastState = state;
    state = { ...state, ...newState };
    listeners.forEach((filter, setter) => {
      if (!simpleEquals(filter(state), lastState)) {
        setter(filter(state), action);
      }
    });
  }

  function bindAction(action) {
    return function boundAction(...args) {
      Promise.resolve(action(state, ...args)).then(setState);
    };
  }

  return { subscribe, unsubscribe, setState, getState, bindAction };
}

export function createIntegration({
  createContext,
  useContext,
  useMemo,
  useEffect,
  createElement,
  memo,
  Component,
}) {
  // Create context
  const CONTEXT = createContext();
  CONTEXT.displayName = 'Unistore';

  function Provider(props) {
    return createElement(CONTEXT.Provider, props);
  }

  function useStore(filterState, actions) {
    filterState = useMemo(() => {
      return typeof filterState != 'function'
        ? select(filterState)
        : filterState;
    }, [filterState]);

    const store = useContext(CONTEXT);
    const [filteredState, setState] = useState(() => store.getState());

    const mappedActions = useMemo(() => {
      mapActions(actions, store);
    }, [actions, store]);

    useEffect(() => {
      store.subscribe(setState, filterState);
      return () => store.unsubscribe(setState);
    }, [store, setState, filterState]);

    return [filteredState, mappedActions];
  }

  function connect(filterState, actions) {
    if (typeof filter != 'function') {
      filterState = select(filterState);
    }
    return function connectComponent(ChildComponent) {
      const MemoizedComponent = memo(ChildComponent);
      class ConnectedComponent extends Component {
        constructor(props) {
          super(props);

          this.state = filterState(this.context.getState());
          this.actions = mapActions(actions, this.store);

          this.listener = this.listener.bind(this);
        }

        componentDidMount() {
          this.context.subscribe(this.listener, filterState);
        }

        componentWillUnmount() {
          this.context.unsubscribe(this.listener);
        }

        listener(filteredState) {
          this.setState(filteredState);
        }

        render() {
          return createElement(MemoizedComponent, {
            ...this.state,
            ...this.actions,
            ...this.props,
          });
        }
      }

      ConnectedComponent.contextType = CONTEXT;

      const childName =
        ChildComponent.displayName || ChildComponent.name || 'Component';
      ConnectedComponent.displayName = `Connect(${childName})`;

      return ConnectedComponent;
    };
  }

  return { useStore, Provider, connect };
}

export function connectDevtools(store) {
  const extension =
    window.__REDUX_DEVTOOLS_EXTENSION__ ||
    window.top.__REDUX_DEVTOOLS_EXTENSION__;
  if (!extension) {
    console.warn('Please install/enable Redux devtools extension');
    return;
  }

  let ignoreState = false;

  const devtools = extension.connect();
  devtools.init(store.getState());
  devtools.subscribe(message => {
    if (message.type === 'DISPATCH' && message.state) {
      ignoreState =
        message.payload.type === 'JUMP_TO_ACTION' ||
        message.payload.type === 'JUMP_TO_STATE';
      store.setState(JSON.parse(message.state));
    }
  });

  function listener(state, { name = 'setState' }) {
    if (!ignoreState) {
      devtools.send(name, state);
    } else {
      ignoreState = false;
    }
  }
  const filter = () => ({ __UNISTORE_DEVTOOLS__: true });
  store.subscribe(listener, filter);
}
