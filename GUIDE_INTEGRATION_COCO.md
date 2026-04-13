# 📕 Guide d'Intégration : Subscription & Payment CoCo

Ce document explique comment tester le module de paiement et comment les autres membres de l'équipe peuvent l'intégrer dans leurs fonctionnalités respectives.

## 🌐 Chemins de Navigation (Navigateur)
Ces URLs sont accessibles via le frontend (Angular) :

| Page | Path | Description |
|---|---|---|
| **Tarification** | `/subs-payment/pricing` | Choix d'un plan et initiation du paiement (Stripe). |
| **Dashboard User** | `/subs-payment/dashboard` | Statut de l'abonnement, Quota restant, Historique et Factures. |
| **Admin Analytics** | `/subs-payment/admin/subscriptions` | Graphique des revenus et gestion manuelle des quotas (Bonus). |

---

## 🛠️ Guide pour les Développeurs (Intégration)

Si vous développez une fonctionnalité (ex: Création de Post, Partage) et que vous avez besoin de vérifier ou diminuer le quota d'un utilisateur, voici comment faire.

### 1. Vérifier le Quota d'un Utilisateur
**Endpoint :** `GET /api/payment/quota/{userId}`

**Réponse JSON typique :**
```json
{
  "hasActiveSub": true,
  "remainingPosts": 15,
  "planName": "MONTHLY",
  "isUnlimited": false
}
```

### 2. Consommer un Quota (Action Système)
Lorsqu'un utilisateur effectue une action payante (ex: publier un post), vous devez appeler cet endpoint depuis le backend de votre service :

**Endpoint :** `POST /api/payment/consume/{userId}`

- **Succès (200 OK)** : Le quota a été diminué avec succès.
- **Erreur (400 Bad Request)** : L'utilisateur n'a pas d'abonnement actif ou son quota est épuisé.

---

## 💡 Exemple d'Intégration (Angular Service)
Si vous voulez afficher un message d'erreur si l'utilisateur ne peut plus poster :

```typescript
// Dans votre service
checkAndPost(userId: number) {
  this.http.post(`/api/payment/consume/${userId}`, {}).subscribe({
    next: () => {
      // Autoriser l'action
      console.log("Action autorisée, quota décompté.");
    },
    error: (err) => {
      // Afficher une alerte
      alert("Quota épuisé ! Veuillez renouveler votre abonnement.");
    }
  });
}
```

## ⚙️ Configuration Backend
- Le service tourne sur le port `7082`.
- Les appels doivent passer par l'**API Gateway** (port `9092`) via le préfixe `/api/payment/`.

---
**Glory to ESPRIT!** 🚀
