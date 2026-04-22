import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Boost } from '../models/boost.model';

@Injectable({ providedIn: 'root' })
export class BoostService {
  private baseUrl = 'http://localhost:8099/api/boosts';

  constructor(private http: HttpClient) {}

  create(boost: Boost): Observable<Boost> {
    return this.http.post<Boost>(this.baseUrl, boost);
  }

  isBoosted(furnitureId: number): Observable<{ boosted: boolean }> {
    return this.http.get<{ boosted: boolean }>(`${this.baseUrl}/check/${furnitureId}`);
  }

  getBySeller(sellerId: number): Observable<Boost[]> {
    return this.http.get<Boost[]>(`${this.baseUrl}/seller/${sellerId}`);
  }

  async analyzeWithAI(furniture: any): Promise<any> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Analyse cette annonce de meuble tunisien et réponds UNIQUEMENT en JSON valide sans markdown:
{
  "suggestedPrice": number,
  "currentPriceScore": number (0-100),
  "visibilityScore": number (0-100),
  "suggestedCategory": "string",
  "improvedTitle": "string",
  "improvedDescription": "string",
  "recommendedDuration": 1 ou 3 ou 7,
  "reasoning": "string"
}

Annonce:
Titre: ${furniture.title}
Description: ${furniture.description}
Catégorie: ${furniture.category}
Prix: ${furniture.price} DT
Condition: ${furniture.condition}

Contexte: marché tunisien, prix en DT, recommande durée boost optimale.`
        }]
      })
    });
    const data = await response.json();
    const text = data.content[0].text;
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  }
}
