# CoCo Application Architecture: Collocation & User Security Modules

This document provides a comprehensive overview of the implementation details for the **User Security** and **Collocation** modules, tracing the architecture from the Angular frontend to the Spring Boot microservices backend.

---

## 1. System Overview

The application follows a **Microservices Architecture** on the backend and a **Modular Architecture** on the frontend. 
* **Backend**: Developed with Spring Boot and Spring Cloud. It features an `apiGateway` to route traffic to independent microservices such as `userSecurityService` and `collocationService`.
* **Frontend**: Developed with Angular (v16+). It uses feature modules to strictly separate concerns (`user-security` and `collocation`), ensuring clean separation, lazy loading, and reactive state management.

---

## 2. User Security Implementation

### 2.1 Backend (`userSecurityService`)
The **User Security Service** is a dedicated Spring Boot microservice responsible for Authentication, Authorization, and User Profile management.

* **Security Core**: Built on **Spring Security** utilizing **JWT (JSON Web Tokens)**.
* **OAuth2 Integration**: Implements an `OAuth2SuccessHandler` for third-party SSO strategies.
* **Controllers**: Exposes REST endpoints via AuthController, UserController, AdminController, etc.
* **Core Services**:
  * `AuthService` & `UserService`: Handle registration, login, and user state operations.
  * `UserProfileService`: Manages extra user demographics needed for features like AI matching.
  * `RefreshTokenService`: Oversees JWT expiration and token refresh logic.
  * `EmailService`: Manages verification and notification emails.
  * `MatchingCollocService`: Handles backend workflows for matching users based on profiles.
* **Filters & Configurations**: Employs custom `SecurityConfig` and `CorsConfig` to block unauthorized access and validate payloads before routing.

### 2.2 Frontend (`user-security` Angular Module)
The frontend module mirrors the backend's security architecture to maintain a synchronized session and secure routing.

* **Interceptors**: 
  * Injects JWT tokens into the headers of outgoing HTTP requests.
  * Handles token refreshing automatically if 401 Unauthorized errors are caught.
* **Guards**: 
  * `AuthGuard` & `RoleGuard`: Angular router guards preventing unauthenticated or unauthorized users from accessing certain pages (like creating offers or viewing admin panels).
* **State Management**: Uses a centralized `state` mechanism (Signals or RxJS BehaviorSubjects) to keep user session data synced across the application without querying the backend repeatedly.
* **Services**: Exposes `UserService` and `MatchingService` to other modules (like Collocation) allowing them to safely access the `currentUser` and trigger AI matching.

---

## 3. Collocation Module Implementation

### 3.1 Backend (`collocationService`)
The **Collocation Service** is an independent Spring Boot microservice handling property/roommate offers, lifecycle, and requests.

* **Core Entities**:
  * `collocOffre`: Represents the baseline details of a property/room collocation.
  * `collocOffreRequest`: Manages applications submitted by users to join an offer.
  * `collocOffreFavorite`: Tracks saved/liked offers per user.
  * `collocOffreImage`: File entities for the gallery.
* **Controllers**: Includes `CollocationController`, `CollocationRequestsController`, `CollocationFavController`, and `ImageUploadController`.
* **Database & Filtering**: Implements `collocOffreSpecifications` using Spring Data JPA Specifications to dynamically filter offers by price, city, and furnishing status without hardcoding queries.
* **File Storage**: Includes `FileStorageService` to securely handle and serve uploaded images.

### 3.2 Frontend (`collocation` Angular Module)
The Collocation frontend module provides the UI and orchestrates user experience for browsing and applying to offers.

* **Components**: 
  * `collocation-listOffres`: The primary hub for browsing. Includes deep integration with Leaflet Maps, complex multi-criteria filtering, and Real-time AI Match Toggles.
  * *Voice Search*: Integrates the Web Speech API securely within `collocation-listOffres` to allow hands-free searching.
* **Services**:
  * `CollocationService`: Direct API gateway caller for fetching, filtering, and favoring offers.
  * `VoiceSearchService`: An injected NgZone-wrapped Web Speech API service.
* **Cross-Module Interaction**: Heavily imports and interacts with the `user-security` module. The `collocation-listOffres` component verifies the user's profile completeness via `UserService` before enabling the `MatchingService` AI scores.

---

## 4. Architectural Data Flow Example: AI Matching

1. **Frontend Request**: The user clicks "Activer IA Match" on the Angular `collocation-listOffres` component.
2. **State Validation**: Angular checks the `user-security` state. If the profile is incomplete, it blocks the request.
3. **API Call**: Angular maps the current offers and queries `MatchingService`.
4. **Backend Processing**: The gateway routes to `userSecurityService` -> `MatchingCollocService`.
5. **Evaluation**: Profiles are compared via Python ML microservice or internal algorithms.
6. **Frontend Render**: Angular maps the received scores (percentages) back into the UI, dynamically sorting `collocation-listOffres` and updating CSS highlight rings.
