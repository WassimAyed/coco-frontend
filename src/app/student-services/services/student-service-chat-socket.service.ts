import { Injectable, OnDestroy, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StompSocketService } from '../../shared/services/stomp-socket.service';
import {
  StudentServiceChatMessage,
  StudentServiceChatTypingIndicator,
} from '../models/student-service.model';

interface SocketChatMessagePayload {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  imageUrl?: string | null;
  sentAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
}

interface SocketChatTypingPayload {
  conversationId: number;
  senderId: number;
  senderName: string;
  typing: boolean;
  sentAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class StudentServiceChatSocketService implements OnDestroy {
  private readonly socketService = inject(StompSocketService);
  private readonly connectionKey = 'student-services-chat';
  private readonly messageTopicBindings = new Set<string>();
  private readonly messageStreams = new Map<
    string,
    Subject<StudentServiceChatMessage>
  >();
  private readonly typingTopicBindings = new Set<string>();
  private readonly typingStreams = new Map<
    string,
    Subject<StudentServiceChatTypingIndicator>
  >();

  isConnected(): boolean {
    return this.socketService.isConnected(this.connectionKey);
  }

  resetBindings(): void {
    this.messageTopicBindings.clear();
    this.typingTopicBindings.clear();
  }

  watchConversationMessages(
    conversationId: string,
  ): Observable<StudentServiceChatMessage> {
    const stream = this.getOrCreateMessageStream(conversationId);
    this.subscribeToConversationMessages(conversationId);
    return stream.asObservable();
  }

  watchConversationTyping(
    conversationId: string,
  ): Observable<StudentServiceChatTypingIndicator> {
    const stream = this.getOrCreateTypingStream(conversationId);
    this.subscribeToConversationTyping(conversationId);
    return stream.asObservable();
  }

  sendMessage(payload: {
    content: string;
    conversationId: number;
    senderId: number;
    senderName: string;
  }): void {
    const published = this.socketService.publish(
      this.connectionKey,
      this.buildSocketUrl(),
      '/app/student-services/chat.send',
      JSON.stringify(payload),
    );
    if (!published) {
      throw new Error('Chat socket is not connected yet.');
    }
  }

  publishTyping(payload: {
    conversationId: number;
    senderId: number;
    senderName: string;
    typing: boolean;
  }): void {
    this.socketService.publish(
      this.connectionKey,
      this.buildSocketUrl(),
      '/app/student-services/chat.typing',
      JSON.stringify(payload),
    );
  }

  ngOnDestroy(): void {
    this.socketService.disconnect(this.connectionKey);
  }

  private subscribeToConversationMessages(conversationId: string): void {
    if (this.messageTopicBindings.has(conversationId)) {
      return;
    }

    const stream = this.getOrCreateMessageStream(conversationId);
    this.messageTopicBindings.add(conversationId);
    this.socketService
      .watchTopic(
        this.connectionKey,
        this.buildSocketUrl(),
        `/topic/student-services/chat/${conversationId}`,
      )
      .subscribe((rawMessage) => {
        const payload = JSON.parse(rawMessage) as SocketChatMessagePayload;
        stream.next({
          content: payload.content,
          conversationId: String(payload.conversationId),
          deletedAt: payload.deletedAt ?? null,
          editedAt: payload.editedAt ?? null,
          id: String(payload.id),
          imageUrl: payload.imageUrl ?? null,
          senderId: String(payload.senderId),
          senderName: payload.senderName,
          sentAt: payload.sentAt,
        });
      });
  }

  private subscribeToConversationTyping(conversationId: string): void {
    if (this.typingTopicBindings.has(conversationId)) {
      return;
    }

    const stream = this.getOrCreateTypingStream(conversationId);
    this.typingTopicBindings.add(conversationId);
    this.socketService
      .watchTopic(
        this.connectionKey,
        this.buildSocketUrl(),
        `/topic/student-services/chat/${conversationId}/typing`,
      )
      .subscribe((rawMessage) => {
        const payload = JSON.parse(rawMessage) as SocketChatTypingPayload;
        stream.next({
          conversationId: String(payload.conversationId),
          senderId: String(payload.senderId),
          senderName: payload.senderName,
          sentAt: payload.sentAt,
          typing: payload.typing,
        });
      });
  }

  private getOrCreateMessageStream(
    conversationId: string,
  ): Subject<StudentServiceChatMessage> {
    let stream = this.messageStreams.get(conversationId);
    if (!stream) {
      stream = new Subject<StudentServiceChatMessage>();
      this.messageStreams.set(conversationId, stream);
    }
    return stream;
  }

  private getOrCreateTypingStream(
    conversationId: string,
  ): Subject<StudentServiceChatTypingIndicator> {
    let stream = this.typingStreams.get(conversationId);
    if (!stream) {
      stream = new Subject<StudentServiceChatTypingIndicator>();
      this.typingStreams.set(conversationId, stream);
    }
    return stream;
  }

  private buildSocketUrl(): string {
    const normalizedBase = environment.studentServices.apiBaseUrl.replace(
      /\/+$/,
      '',
    );
    const normalizedPath = environment.studentServices.websocketPath.startsWith(
      '/',
    )
      ? environment.studentServices.websocketPath
      : `/${environment.studentServices.websocketPath}`;

    return `${normalizedBase}${normalizedPath}`;
  }
}
