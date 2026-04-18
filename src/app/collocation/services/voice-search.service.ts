import { Injectable, NgZone } from '@angular/core';
import { Subject, BehaviorSubject, Observable } from 'rxjs';

declare var window: any;

@Injectable({
  providedIn: 'root'
})
export class VoiceSearchService {
  private recognition: any;
  private isListeningSubject = new BehaviorSubject<boolean>(false);
  private textSubject = new Subject<string>();
  private errorSubject = new Subject<string>();

  public isListening$: Observable<boolean> = this.isListeningSubject.asObservable();
  public text$: Observable<string> = this.textSubject.asObservable();
  public error$: Observable<string> = this.errorSubject.asObservable();

  constructor(private zone: NgZone) {
    this.initSpeechRecognition();
  }

  private initSpeechRecognition(): void {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognitionAPI) {
      this.recognition = new SpeechRecognitionAPI();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'fr-FR';
      
      this.recognition.onstart = () => {
        this.zone.run(() => this.isListeningSubject.next(true));
      };

      this.recognition.onresult = (event: any) => {
        let transcript = event.results[0][0].transcript;
        
        // Remove trailing full stop points and extra spaces that speech-to-text often adds
        transcript = transcript.replace(/\.+$/, '').trim();

        this.zone.run(() => {
          this.textSubject.next(transcript);
        });
      };

      this.recognition.onerror = (event: any) => {
        this.zone.run(() => {
          this.isListeningSubject.next(false);
          this.errorSubject.next(event.error);
        });
      };

      this.recognition.onend = () => {
        this.zone.run(() => this.isListeningSubject.next(false));
      };
    }
  }

  public setLanguage(lang: string): void {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public startListening(): void {
    if (!this.recognition) {
      this.errorSubject.next('not_supported');
      return;
    }
    
    if (!this.isListeningSubject.value) {
      this.recognition.start();
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListeningSubject.value) {
      this.recognition.stop();
    }
  }
}
