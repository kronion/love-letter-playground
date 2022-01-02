import Actions from './actions';

export const createSocketMiddleware = (url: string) => {
  const middleware = storeApi => {
    var socket: WebSocket | null = null;

    const createSocket = () => {
      socket = new WebSocket(url);

      socket.onopen = event => {
        storeApi.dispatch(Actions.socketConnected());
      };

      socket.onmessage = event => {
        Actions.socketReceive(event.data);
        // storeApi.dispatch(Actions.socketReceive(event.data));
      };

      // Try to reconnect automatically
      socket.onclose = event => {
        createSocket();
      };
    };
    createSocket();

    return next => action => {
      if (Actions.socketSend.match(action)) {
        if (socket === null) {
          throw new Error("Cannot send message, socket closed");
        }
        socket.send(JSON.stringify(action.payload));
        return;
      }
      return next(action);
    };
  };

  return middleware;
};
