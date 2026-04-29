# CoCo Frontend – Angular Application (FR/EN)

## Table of Contents / Sommaire
- [Français](#francais)
	- [Objectif](#fr-objectif)
	- [Stack](#fr-stack)
	- [Prérequis](#fr-prerequis)
	- [Installation & lancement](#fr-installation-lancement)
	- [Scripts](#fr-scripts)
	- [Environnement](#fr-environnement)
	- [Intégration backend](#fr-integration-backend)
	- [Dépannage rapide](#fr-depannage-rapide)
- [English](#english)
	- [Purpose](#en-purpose)
	- [Stack](#en-stack)
	- [Requirements](#en-requirements)
	- [Setup & run](#en-setup-run)
	- [Scripts](#en-scripts)
	- [Environment](#en-environment)
	- [Backend integration](#en-backend-integration)
	- [Quick troubleshooting](#en-quick-troubleshooting)

<a id="francais"></a>
## 🇫🇷 Français

<a id="fr-objectif"></a>
### 1) Objectif
Le frontend CoCo fournit une interface unifiée pour les modules métiers (authentification, Lost&Found, collocation, paiements, événements, etc.).

<a id="fr-stack"></a>
### 2) Stack
- Angular 18
- TypeScript
- Bootstrap 5 + Tailwind CSS
- RxJS
- STOMP/SockJS (temps réel)

<a id="fr-prerequis"></a>
### 3) Prérequis
- Node.js 18+
- npm

<a id="fr-installation-lancement"></a>
### 4) Installation & lancement
Dans `frontendCoCo_DevDynamos/`:
- `npm install`
- `npm start`
- app disponible sur `http://localhost:4200`

<a id="fr-scripts"></a>
### 5) Scripts
- `npm start` → dev server
- `npm run build` → build production
- `npm run watch` → build watch
- `npm test` → tests unitaires (Karma/Jasmine)

<a id="fr-environnement"></a>
### 6) Environnement
Fichier principal: `src/environments/environment.ts`

Endpoints configurés:
- Auth/User Security: `http://localhost:8090/`
- API Gateway: `http://localhost:9092/...`
- Student Services: `http://localhost:8095` (à confirmer selon backend)

⚠️ Production: déplacer les secrets (ex: clés API) hors du code source.

<a id="fr-integration-backend"></a>
### 7) Intégration backend
Le frontend passe principalement par l’API Gateway et les endpoints sécurité.
Pour un run full-stack local: `./run-all.sh` à la racine du projet parent.

<a id="fr-depannage-rapide"></a>
### 8) Dépannage rapide
- CORS: vérifier config gateway/backend
- API down: vérifier services et ports
- build cassé: réinstaller dépendances
- websocket KO: vérifier URL STOMP/SockJS

---

<a id="english"></a>
## 🇬🇧 English

<a id="en-purpose"></a>
### 1) Purpose
The CoCo frontend provides a unified UI for business modules (authentication, Lost&Found, colocation, payments, events, etc.).

<a id="en-stack"></a>
### 2) Stack
- Angular 18
- TypeScript
- Bootstrap 5 + Tailwind CSS
- RxJS
- STOMP/SockJS (real-time)

<a id="en-requirements"></a>
### 3) Requirements
- Node.js 18+
- npm

<a id="en-setup-run"></a>
### 4) Setup & run
Inside `frontendCoCo_DevDynamos/`:
- `npm install`
- `npm start`
- app at `http://localhost:4200`

<a id="en-scripts"></a>
### 5) Scripts
- `npm start` → dev server
- `npm run build` → production build
- `npm run watch` → watch build
- `npm test` → unit tests (Karma/Jasmine)

<a id="en-environment"></a>
### 6) Environment
Main file: `src/environments/environment.ts`

Configured endpoints:
- Auth/User Security: `http://localhost:8090/`
- API Gateway: `http://localhost:9092/...`
- Student Services: `http://localhost:8095` (confirm with current backend setup)

⚠️ Production: move secrets (e.g., API keys) out of source code.

<a id="en-backend-integration"></a>
### 7) Backend integration
The frontend mainly communicates through API Gateway and security endpoints.
For full local stack startup: run `./run-all.sh` from the parent root.

<a id="en-quick-troubleshooting"></a>
### 8) Quick troubleshooting
- CORS issues: check gateway/backend CORS config
- API unreachable: verify service status and ports
- broken build: reinstall dependencies
- websocket issues: validate STOMP/SockJS URLs
