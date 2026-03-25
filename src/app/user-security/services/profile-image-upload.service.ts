import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { loadAuthSession } from '../utils/auth-session.util';

function resolveUploadUrl(baseUrl: string, pathOrUrl: string): string {
  const trimmedValue = pathOrUrl.trim();
  if (!trimmedValue) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue;
  }

  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = trimmedValue.startsWith('/')
    ? trimmedValue
    : `/${trimmedValue}`;

  return `${normalizedBase}${normalizedPath}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

function readString(
  record: Record<string, unknown> | null,
  keys: string[],
): string | null {
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileImageUploadService {
  private readonly http = inject(HttpClient);

  async uploadProfileImage(file: File): Promise<string> {
    const uploadUrl = resolveUploadUrl(
      environment.apiBaseUrl,
      environment.storage.profileImageUploadUrl,
    );

    if (!uploadUrl) {
      throw new Error(
        'Profile image upload endpoint is not configured in environment.ts.',
      );
    }

    const formData = new FormData();
    formData.append(environment.storage.profileImageFormFieldName, file);

    const response = await firstValueFrom(
      this.http.post<unknown>(uploadUrl, formData, {
        headers: this.getAuthorizationHeaders(),
        withCredentials: environment.storage.withCredentials,
      }),
    );

    const uploadedImageUrl = this.extractUploadedImageUrl(response);
    if (!uploadedImageUrl) {
      throw new Error(
        'Storage server did not return the uploaded image URL.',
      );
    }

    return uploadedImageUrl;
  }

  private extractUploadedImageUrl(response: unknown): string | null {
    const root = asRecord(response);
    const data = asRecord(root?.['data']);
    const payload = asRecord(data?.['result']) ?? data ?? root;

    return (
      readString(payload, [
        'url',
        'imageUrl',
        'fileUrl',
        'downloadUrl',
        'objectUrl',
        'path',
      ]) ??
      readString(root, [
        'url',
        'imageUrl',
        'fileUrl',
        'downloadUrl',
        'objectUrl',
        'path',
      ])
    );
  }

  private getAuthorizationHeaders(): HttpHeaders {
    const session = loadAuthSession();
    const accessToken = session?.accessToken?.trim();

    return accessToken
      ? new HttpHeaders({ Authorization: `Bearer ${accessToken}` })
      : new HttpHeaders();
  }
}
