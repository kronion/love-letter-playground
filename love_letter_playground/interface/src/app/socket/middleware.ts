import { actions } from './slice';
import socketReceive from './dispatcher';

export const createSocketMiddleware = (url: string) => {
  const middleware = storeApi => {
    var socket: WebSocket | null = null;
    let retryTimeout = 2;

    const createSocket = () => {
      socket = new WebSocket(url);
      console.log(socket);

      socket.onopen = () => {
        storeApi.dispatch(actions.socketConnected());
        retryTimeout = 2;
      };

      socket.onmessage = event => {
        const data = JSON.parse(event.data);
        socketReceive(data, storeApi.dispatch);
      };

      // Try to reconnect automatically
      socket.onclose = () => {
        setTimeout(createSocket, retryTimeout * 1000);
        retryTimeout = Math.min(2 * retryTimeout, 30);
      };
    };
    createSocket();

    return next => action => {
      if (actions.send.match(action)) {
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