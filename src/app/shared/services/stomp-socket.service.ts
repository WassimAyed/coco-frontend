import { Injectable, signal } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import { Observable, Subject } from 'rxjs';

type SocketConnectionState = 'idle' | 'connecting' | 'connected' | 'error';

interface SocketConnectionRecord {
  client: Client;
  socketUrl: string;
  state: ReturnType<typeof signal<SocketConnectionState>>;
  subscriptions: Map<string, StompSubscription>;
  streams: Map<string, Subject<string>>;
}

@Injectable({
  providedIn: 'root',
})
export class StompSocketService {
  private readonly connections = new Map<string, SocketConnectionRecord>();

  isConnected(connectionKey: string): boolean {
    return this.connections.get(connectionKey)?.state() === 'connected';
  }

  watchTopic(
    connectionKey: string,
    socketUrl: string,
    topic: string,
  ): Observable<string> {
    const connection = this.ensureConnection(connectionKey, socketUrl);
    let stream = connection.streams.get(topic);
    if (!stream) {
      stream = new Subject<string>();
      connection.streams.set(topic, stream);
    }

    this.subscribeToTopic(connection, topic);
    return stream.asObservable();
  }

  publish(
    connectionKey: string,
    socketUrl: string,
    destination: string,
    body: string,
  ): boolean {
    const connection = this.ensureConnection(connectionKey, socketUrl);
    if (!connection.client.connected) {
      return false;
    }

    connection.client.publish({
      body,
      destination,
    });
    return true;
  }

  disconnect(connectionKey: string): void {
    const connection = this.connections.get(connectionKey);
    if (!connection) {
      return;
    }

    for (const subscription of connection.subscriptions.values()) {
      subscription.unsubscribe();
    }
    connection.subscriptions.clear();
    connection.client.deactivate();
    this.connections.delete(connectionKey);
  }

  private ensureConnection(
    connectionKey: string,
    socketUrl: string,
  ): SocketConnectionRecord {
    const existingConnection = this.connections.get(connectionKey);
    if (existingConnection) {
      return existingConnection;
    }

    const state = signal<SocketConnectionState>('connecting');
    const connection: SocketConnectionRecord = {
      client: new Client({
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        reconnectDelay: 5000,
        webSocketFactory: () => new SockJS(socketUrl),
      }),
      socketUrl,
      state,
      streams: new Map<string, Subject<string>>(),
      subscriptions: new Map<string, StompSubscription>(),
    };

    connection.client.onConnect = () => {
      connection.state.set('connected');
      for (const topic of connection.streams.keys()) {
        this.subscribeToTopic(connection, topic);
      }
    };

    connection.client.onDisconnect = () => {
      connection.state.set('idle');
      connection.subscriptions.clear();
    };

    connection.client.onStompError = (frame) => {
      console.error('[STOMP] Protocol error — removing stale connection:', frame);
      connection.state.set('error');
      connection.subscriptions.clear();
      this.connections.delete(connectionKey);
    };

    connection.client.onWebSocketError = (event) => {
      console.error('[STOMP] WebSocket transport error:', event);
      connection.state.set('error');
      connection.subscriptions.clear();
      this.connections.delete(connectionKey);
    };

    connection.client.activate();
    this.connections.set(connectionKey, connection);
    return connection;
  }

  private subscribeToTopic(
    connection: SocketConnectionRecord,
    topic: string,
  ): void {
    if (!connection.client.connected || connection.subscriptions.has(topic)) {
      return;
    }

    const stream = connection.streams.get(topic);
    if (!stream) {
      return;
    }

    const subscription = connection.client.subscribe(topic, (message: IMessage) => {
      stream.next(message.body);
    });

    connection.subscriptions.set(topic, subscription);
  }
}
