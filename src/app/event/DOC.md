# Event Management System - Complete Documentation

## Overview

This document provides comprehensive information about the event management system implementation, including data models, API layer, user authentication, feature workflows, and testing scenarios.

---

## 1. Architecture

### Directory Structure

```
src/app/event/
├── models/
│   ├── event.model.ts           # EventDto, CreateEventRequest, UpdateEventRequest
│   ├── event-query.model.ts     # Query filters (DateRangeQuery, NearbyQuery, etc)
│   ├── category.model.ts        # CategoryDto
│   ├── event-image.model.ts     # EventImageDto for gallery
│   ├── reaction.model.ts        # ReactionDto, ReactionType, ReactionSummaryDto
│   ├── comment.model.ts         # CommentDto for comments
│   └── participant.model.ts     # ParticipantDto for event participants
│
├── services/
│   ├── event.service.ts              # Event CRUD, search, filters, gallery
│   ├── reaction.service.ts           # Reaction add/update, delete, summary
│   ├── comment.service.ts            # Comment CRUD, by event, count
│   ├── participant.service.ts        # Participant list, count by event
│   ├── share.service.ts              # Facebook share + share summary
│   └── event-ownership.service.ts    # Local userId-to-eventIds mapping
│
├── components/
│   ├── event-list/
│   │   ├── event-list.component.ts
│   │   ├── event-list.component.html
│   │   └── event-list.component.css
│   │
│   ├── event-detail/
│   │   ├── event-detail.component.ts
│   │   ├── event-detail.component.html
│   │   └── event-detail.component.css
│   │
│   └── my-events/
│       ├── my-events.component.ts      # User's owned events management
│       ├── my-events.component.html
│       └── my-events.component.css
│
├── event.module.ts              # Module declarations & imports
├── event-routing.module.ts      # Route configuration
└── DOC.md                       # This file
```

### Data Flow Architecture

```
User Interface (Component)
        ↓
  Service Layer (HTTP calls)
        ↓
  HTTP Client (Angular HttpClient)
        ↓
  Backend API (Spring Boot microservice)
        ↓
  Database (JPA/Hibernate)
```

**Example: Creating an Event**
1. User fills form in `event-list.component.ts`
2. Component calls `eventService.create(payload)`
3. Service makes `POST /api/events` request
4. Backend validates, stores in DB, returns EventDto with ID
5. Component stores ownership in localStorage via `EventOwnershipService`
6. Component resets form and reloads event list

### Map Implementation (OpenLayers) — Frontend & Backend Contract

Business logic is unchanged. Map rendering is implemented with OpenLayers in the frontend.

**Frontend (Angular + OpenLayers):**
- `event-list.component.ts` initializes an OpenLayers map and draggable marker for event creation.
- `event-detail.component.ts` initializes a read-only OpenLayers map centered on event coordinates.
- Tile source remains OpenStreetMap (OSM layer in OpenLayers).
- User interactions still produce the same payload fields: `latitude`, `longitude`, `location`.

**Backend (Spring Boot):**
- No controller/service/domain change required for map migration.
- Existing API contract is preserved (`latitude`, `longitude`, optional `fullAddress`).
- Geocoding/reverse-geocoding behavior remains server-side and unchanged.

**Compatibility Note:**
- Old iframe display was replaced by OpenLayers components.
- Event creation, filtering, and persistence logic remain exactly the same.

---

## 2. User Authentication & Authorization

### Login Flow

1. User enters email/password on login page
2. **Authentication Service** (`user-security/services/auth-api.service.ts`) sends credentials to backend
3. Backend validates, returns JWT token + user profile
4. **UserService** stores session in `authStore` (signal-based reactive store)
5. **Login Component** stores `userId` in `localStorage.setItem('userId', user.id)`
6. Frontend redirects to home page with authenticated session

### userId Capture & Storage

```typescript
// In login-page.component.ts
private storeUserAndId(user: any): void {
  this.userService.storeUser(user);                    // Store full user profile
  localStorage.setItem('userId', user.id);            // Store userId for quick access
}

// Anywhere in app
const userId = Number(localStorage.getItem('userId')) || null;
```

### User Profile Access

- **Current User**: Accessed via `userService.currentUser()` (computed signal)
- **Current User ID**: `localStorage.getItem('userId')`
- **User Session**: Stored in `authStore` with role-based routing

### Authorization Checks

- **Event Creation**: User must be logged in (checked via `currentUserId !== null`)
- **Event Edit/Delete**: Only event owner can modify (checked via `eventOwnershipService.isOwned()`)
- **Comments/Reactions**: Require logged-in user; only owner can edit/delete comments

---

## 3. Event CRUD Operations

### Event Model (Interface)

```typescript
interface EventDto {
  id?: number;
  name?: string;                    // 3-100 characters (backend enforced)
  description?: string;             // Max 500 characters (backend enforced)
  location?: string;                // Required, text address
  latitude?: number;                // Geolocation coordinate
  longitude?: number;               // Geolocation coordinate
  fullAddress?: string;             // Auto-filled by Nominatim geocoding
  startDate?: string;               // ISO datetime, must be future
  endDate?: string;                 // ISO datetime, after startDate
  status?: EventStatus;             // 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'ANNULE'
  categoryId?: number;              // Foreign key to Category
  categoryName?: string;            // Denormalized category name
  userId?: number;                  // Event creator's user ID
  maxCapacity?: number;             // Maximum participants
  currentParticipants?: number;     // Current registered count
  capacity?: number;                // Alias for maxCapacity
  occupiedPlaces?: number;          // Alias for currentParticipants
  availablePlaces?: number;         // Computed: maxCapacity - currentParticipants
  imageUrl?: string;                // Primary event image
  galleryUrls?: string[];           // Additional gallery images
  createdAt?: string;               // ISO timestamp
  updatedAt?: string;               // ISO timestamp
}

interface CreateEventRequest {
  name: string;
  description?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  startDate?: string;
  endDate?: string;
  status?: EventStatus;
  categoryId: number;
  maxCapacity: number;
  currentParticipants?: number;
  userId?: number;                  // Captured from localStorage
}

interface UpdateEventRequest {
  name?: string;
  description?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  startDate?: string;
  endDate?: string;
  status?: EventStatus;
  categoryId?: number;
  maxCapacity?: number;
  currentParticipants?: number;
  userId?: number;
}
```

### Create Event

**Frontend Validation** (event-list.component.ts):
- User must be logged in (`currentUserId` from localStorage)
- Name: 3-100 characters
- Location: Required, non-empty
- Dates: startDate > now, endDate > startDate
- Description: max 500 chars
- Category: Must be selected
- Map coordinates: Required (click on map to set)

**Backend Validation** (EventDTO via Spring validation):
- Same constraints enforced on server
- Location auto-geocoded via Nominatim API → latitude/longitude/fullAddress filled
- Current participants defaults to 0

**Workflow**:
```typescript
// 1. Collect data from form
const payload: CreateEventRequest = {
  name: 'Tech Conference',
  location: 'Tunis, Tunisia',
  startDate: '2026-04-15T09:00:00',
  endDate: '2026-04-16T17:00:00',
  categoryId: 1,
  maxCapacity: 100,
  userId: 42  // Current user ID
};

// 2. Call service
eventService.create(payload).subscribe({
  next: (created) => {
    // 3. Store ownership mapping
    ownershipService.addOwnedEvent(created.id, currentUserId);
    // 4. Show success, reload list
  }
});
```

### Read Event

**Get Single Event**:
```typescript
eventService.getById(eventId).subscribe(event => { ... });
```

**Get All Events**:
```typescript
eventService.getAll().subscribe(events => { ... });
```

**Fallback**: If getById returns 500, detail component automatically calls getAll() and finds event in list.

### Update Event

**Frontend Rules**:
- Only owner can edit (checked via `eventOwnershipService.isOwned()`)
- Same validations as create

**Workflow**:
```typescript
eventService.update(eventId, updatePayload).subscribe({
  next: () => {
    successMessage = 'Event updated successfully.';
    // Reload event to show changes
  }
});
```

### Delete Event

**Backend Behavior**:
- Only owner can delete (enforced by backend, frontend checks ownership)
- Cascades: Deletes reactions, comments, participants, gallery images

**Workflow**:
```typescript
if (confirm('Delete event?')) {
  eventService.delete(eventId).subscribe({
    next: () => {
      ownershipService.removeOwnedEvent(eventId, userId);
      successMessage = 'Event deleted.';
      navigate to event list
    }
  });
}
```

---

## 4. API Endpoints Reference

### Base URL
`{apiBaseUrl}/api/events` where `apiBaseUrl` is configured in `environments/environment.ts`

### Event Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | Get all events |
| GET | `/api/events/{id}` | Get single event |
| POST | `/api/events` | Create event |
| PUT | `/api/events/{id}` | Update event |
| DELETE | `/api/events/{id}` | Delete event |
| GET | `/api/events/status/{status}` | Filter by status |
| GET | `/api/events/category/{categoryId}` | Filter by category |
| GET | `/api/events/search?name=...` | Search by name |
| GET | `/api/events/available` | Available events (capacity > 0) |
| GET | `/api/events/date-range?from=...&to=...` | Filter by date range |
| GET | `/api/events/nearby?lat=...&lng=...&radius=...` | Nearby events (Haversine formula) |
| GET | `/api/events/{id}/gallery` | Get event gallery images |
| POST | `/api/events/{id}/image` | Upload main image |
| POST | `/api/events/{id}/gallery` | Add gallery image |
| DELETE | `/api/events/gallery/{imageId}` | Delete gallery image |

### Reaction Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reactions` | Add or update reaction |
| DELETE | `/api/reactions/event/{eventId}?authorEmail=...` | Remove reaction |
| GET | `/api/reactions/event/{eventId}/summary` | Get reaction counts |

**Reaction Payload**:
```json
{
  "type": "LIKE",
  "authorName": "John Doe",
  "authorEmail": "john@example.com",
  "eventId": 1
}
```

**ReactionSummaryDto**:
```json
{
  "eventId": 1,
  "totalReactions": 25,
  "reactionCounts": {
    "LIKE": 10,
    "LOVE": 8,
    "HAHA": 4,
    "WOW": 2,
    "SAD": 1,
    "ANGRY": 0
  }
}
```

### Comment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/comments` | Add comment |
| PUT | `/api/comments/{id}` | Update comment |
| DELETE | `/api/comments/{id}` | Delete comment |
| GET | `/api/comments/event/{eventId}` | Get all comments for event |
| GET | `/api/comments/event/{eventId}/count` | Get comment count |

**Comment Payload**:
```json
{
  "content": "Great event!",
  "authorName": "Alice",
  "authorEmail": "alice@example.com",
  "eventId": 1
}
```

### Participant Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/participants` | Register participant |
| DELETE | `/api/participants/{id}` | Unregister participant |
| GET | `/api/participants/{id}` | Get participant details |
| GET | `/api/participants/event/{eventId}` | Get all participants for event |
| GET | `/api/participants/event/{eventId}/count` | Get participant count |

**Participant Payload**:
```json
{
  "fullName": "Bob Smith",
  "email": "bob@example.com",
  "phone": "21612345678",
  "eventId": 1
}
```

---

## 5. Reactions System

### Emoji Mapping

```typescript
const REACTION_EMOJI: Record<ReactionType, string> = {
  LIKE: '👍',
  LOVE: '❤️',
  HAHA: '😂',
  WOW: '😮',
  SAD: '😢',
  ANGRY: '😡'
};
```

### Toggle Logic (Facebook-Style)

**Behavior**:
- **Click new emoji**: Adds reaction OR replaces old reaction
- **Click same emoji again**: Removes reaction

**Example**:
1. User clicks 👍 (LIKE) → reaction added, button highlighted
2. User clicks ❤️ (LOVE) → reaction changes from LIKE to LOVE
3. User clicks ❤️ again → reaction deleted, button unhighlighted

**Implementation**:
```typescript
react(type: ReactionType): void {
  const current = this.selectedReaction;  // User's current reaction
  
  if (current === type) {
    // Same emoji clicked → delete
    reactionService.remove(eventId, userEmail).subscribe({
      next: () => {
        this.selectedReaction = null;
      }
    });
  } else {
    // Different emoji → add/update
    reactionService.addOrUpdate({
      type,
      authorName: userName,
      authorEmail: userEmail,
      eventId
    }).subscribe({
      next: () => {
        this.selectedReaction = type;
      }
    });
  }
}
```

### Persistence

- **Current user reaction**: Stored in `localStorage[event-reaction:{eventId}:{userId}]`
- **Reaction summary**: Fetched from `/api/reactions/event/{eventId}/summary`

### Frontend Display

- Emoji button shows count: `👍 10`
- Active button highlighted (blue background)
- Only authenticated users can react

---

## 6. Comments System

### Comment Model

```typescript
interface CommentDto {
  id?: number;
  content: string;              // 1-1000 characters
  authorName: string;
  authorEmail: string;
  createdAt?: string;           // ISO timestamp
  updatedAt?: string;           // ISO timestamp
  eventId: number;
  userId?: number;              // Optional owner ID for edit/delete checks
}
```

### CRUD Flow

**Create**:
```typescript
addComment(): void {
  const content = this.commentDraft.trim();
  // Validate: 1-1000 characters
  
  commentService.add({
    content,
    authorName: currentUserName,
    authorEmail: currentUserEmail,
    eventId: eventId,
    userId: currentUserId
  }).subscribe({
    next: (created) => {
      // Store ownership mapping for edit/delete
      storeCommentOwner(created.id, currentUserId);
      // Reload comments
    }
  });
}
```

**Read**:
```typescript
commentService.getByEvent(eventId).subscribe(comments => {
  this.comments = comments;
});
```

**Update** (only author):
```typescript
canManageComment(comment: CommentDto): boolean {
  return currentUserId === comment.userId;
}

saveComment(comment: CommentDto): void {
  commentService.update(comment.id, {
    ...comment,
    content: editedContent
  }).subscribe({
    next: () => this.loadComments(eventId);
  });
}
```

**Delete** (only author):
```typescript
deleteComment(commentId: number): void {
  commentService.remove(commentId).subscribe({
    next: () => this.loadComments(eventId);
  });
}
```

### Validation

- **Frontend**: 1-1000 characters
- **Backend**: Validation annotations enforce same rules

### Ownership Check

Comments are owned by `userId` (stored locally in localStorage for edit/delete button visibility). Backend enforces ownership on update/delete.

---

## 7. Participants System

### Participant Model

```typescript
interface ParticipantDto {
  id?: number;
  fullName: string;          // 2-100 characters
  email: string;             // Valid email format
  phone?: string;            // 8 digits (Tunisia format)
  registrationDate?: string; // ISO timestamp
  eventId: number;
}
```

### Display

Participants are displayed in a card on event detail page:
- Shows list of all registered participants
- Participant count displayed in header
- Shows: Name, Email, Registration date

### Backend Integration

```typescript
loadParticipants(eventId: number): void {
  participantService.getByEvent(eventId).subscribe(data => {
    this.participants = data;  // Display in UI
  });
}
```

---

## 8. My Events (User Ownership)

### Purpose

Allows users to view, edit, and delete only events they created.

### Workflow

**Track Ownership**:
```typescript
// When event created
ownershipService.addOwnedEvent(eventId, userId);

// Map stored in localStorage['eventOwnershipMap']
// Structure: { [userId]: [eventId1, eventId2, ...] }
```

**Load My Events**:
```typescript
const userId = ownershipService.getCurrentUserId();
const ownedIds = ownershipService.getOwnedEventIds(userId);

eventService.getAll().subscribe(events => {
  myEvents = events.filter(e => ownedIds.includes(e.id));
});
```

**Edit Event**:
- Same form validation as create
- Backend verifies ownership before updating

**Delete Event**:
- Confirmation dialog
- Backend verifies ownership
- Frontend removes from ownership map

### Route

Access via `/event/my-events` or user menu → "Mes événements"

---

## 9. User Menu Integration

**New Menu Item**: "Mes événements" (My Events)

```html
<a [routerLink]="myEventsRoute">
  <lucide-icon [img]="CalendarDaysIcon"></lucide-icon>
  Mes événements
</a>
```

Routes to `MyEventsComponent` which displays user's created events.

---

## 10. English Internationalization (i18n)

All frontend UI has been translated to English:

### Event List Page
- **Headers**: "All Events" (was "Tous les événements")
- **Form**: "Create Event" (was "Créer un événement")
- **Filters**: "Quick Filters", "Search by name", "Filter status", etc.
- **Messages**: "Event name is required", "Location is required", etc.

### Event Detail Page
- **Navigation**: "Back to events"
- **Sections**: "Reactions", "Comments", "Participants", "Gallery"
- **Messages**: "Unable to load event details", "Comment content is required", etc.

### My Events Page
- **Header**: "My Events"
- **Subtitle**: "Manage events created from your account."
- **Buttons**: "Edit", "Delete", "Save", "Cancel"

### Date Formatting
Changed from `fr-FR` to `en-US` locale in date formatting:
```typescript
new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short'
}).format(date);
// Example output: "Mar 26, 2026, 2:45 PM"
```

**Note**: Backend validation messages remain in French (from EventDTO annotations). Only frontend UI is English.

---

## 11. Testing Scenarios

### Scenario 1: Complete Event Lifecycle

1. **Login**: User logs in with email/password
   - userId stored in localStorage
2. **Create Event**: User navigates to `/event`
   - Fills event form
   - Selects location on map (OpenStreetMap)
   - Submits → event created, ownership recorded
3. **View Event**: Clicks "View details" link
   - Event detail page loads
   - Can see reactions, comments, participants sections
4. **React**: Clicks emoji reaction
   - React button shows highlighted
   - Reaction count updates
5. **Comment**: Adds comment
   - Comment appears in list with timestamp
   - Can edit/delete own comment
6. **Manage**: Visits `/event/my-events`
   - Sees created event
   - Can edit (same validation as create) or delete
7. **Logout**: User logs out
   - userId removed from localStorage
   - Cannot create/react/comment until next login

### Scenario 2: Reaction Toggle (Facebook-Style)

1. User clicks 👍 (LIKE) → Reaction added, count increases, button highlighted
2. User clicks ❤️ (LOVE) → Reaction changes to LOVE, LIKE count decreases, LOVE count increases, LOVE button highlighted
3. User clicks ❤️ again → Reaction deleted, count back to 0, button unhighlighted
4. User can react again

### Scenario 3: Comment Ownership

1. Alice logs in, creates event
2. Bob logs in, adds comment "Great event!"
3. Alice sees Bob's comment but cannot edit/delete it
4. Bob sees his comment with Edit/Delete buttons
5. Bob edits comment → Backend verifies Bob owns it, updates
6. Bob deletes comment → Backend verifies Bob owns it, deletes
7. Comment list refreshes

### Scenario 4: Search & Filter

1. User navigates to `/event`
2. Enters search term "Conference" → Calls `/api/events/search?name=Conference`
3. Filters by category "Tech" → Calls `/api/events/category/1`
4. Filters by date range April 1-30 → Calls `/api/events/date-range?from=...&to=...`
5. Filters to available events → Calls `/api/events/available`
6. Results update dynamically

### Scenario 5: Nearby Events (Haversine Distance)

1. User enters latitude/longitude (e.g., Tunis center: 36.8065, 10.1815)
2. Sets radius to 10 km
3. Clicks "GET /nearby" button
4. Backend calculates Haversine distance for all events
5. Returns events within 10 km radius
6. Results displayed with location map

---

## 12. Error Handling & Validation

### Frontend Validation Layer

| Field | Rules | Error Message |
|-------|-------|---------------|
| Name | 3-100 chars | "Event name must be between 3 and 100 characters." |
| Location | Required | "Location is required." |
| Start Date | Future timestamp | "Start date must be in the future." |
| End Date | After start date | "End date must be after start date." |
| Description | Max 500 chars | "Description must not exceed 500 characters." |
| Category | Required | "Category is required." |
| Max Capacity | > 0 | "Maximum capacity must be greater than 0." |
| Map Coords | Required | "Please select location on the map." |

### Backend Validation Layer

Same constraints enforced via Spring validation annotations on EventDTO.

### API Error Responses

```json
{
  "error": "Validation error message",
  "message": "Additional context"
}
```

Frontend extracts error message and displays in red alert banner.

### Network Error Handling

```typescript
error: (error: HttpErrorResponse) => {
  const message = error?.error?.message || 'Operation failed.';
  this.errorMessage = message;
  this.isLoading = false;
}
```

---

## 13. Performance Considerations

### Image Optimization

- **Lazy Loading**: Gallery images load on scroll
- **Fallback**: Unsplash placeholder if no image URL

### Data Fetching

- **Pagination**: Could be added to event list (not yet implemented)
- **Caching**: localStorage caches ownership maps locally
- **Debouncing**: Search/filter calls could be debounced

### Bundle Size

- **Event module size**: 107.34 kB (lazy-loaded)
- **Optimizations**: Tree-shaking unused code

---

## 14. Security

### Frontend Security

- **XSS Prevention**: Angular sanitizes HTML by default
- **CSRF**: Token likely handled by backend via Spring Security
- **Local Storage**: userId and ownership maps stored (not sensitive tokens)

### Backend Security

- **Authentication**: JWT tokens validated on each request
- **Authorization**: userId from token matched against event.userId for edit/delete
- **Validation**: All inputs validated server-side

### CORS

API is configured with `@CrossOrigin(origins = "*")` on all controllers.

---

## 15. File References & Line Numbers

### Key Implementation Files

| File | Component | Lines |
|------|-----------|-------|
| [event-list.component.ts](event-list.component.ts) | Create, list, filter events | 1-560 |
| [event-list.component.html](event-list.component.html) | Create form, filters, event cards | 1-140 |
| [event-detail.component.ts](event-detail.component.ts) | Reactions, comments, participants | 1-700+ |
| [event-detail.component.html](event-detail.component.html) | Detail view, reactions UI, comment form | 1-180+ |
| [my-events.component.ts](my-events.component.ts) | User's owned events | 1-130 |
| [my-events.component.html](my-events.component.html) | Edit/delete owned events | 1-70 |
| [reaction.service.ts](services/reaction.service.ts) | API calls for reactions | 1-30 |
| [comment.service.ts](services/comment.service.ts) | API calls for comments | 1-35 |
| [participant.service.ts](services/participant.service.ts) | API calls for participants | 1-20 |
| [event-ownership.service.ts](services/event-ownership.service.ts) | Local userId-eventIds tracking | 1-50 |
| [event.model.ts](models/event.model.ts) | Data interfaces | 1-60 |

---

## 16. Future Enhancements

1. **Pagination**: Load events in chunks (50 per page)
2. **Real-time Updates**: WebSocket for live reaction/comment counts
3. **Notifications**: Email when someone reacts to/comments on user's event
4. **Event Calendar**: Visualize events on calendar view
5. **Export**: Download event list as CSV/PDF
6. **Bulk Operations**: Select multiple events for bulk delete
7. **Dark Mode**: Theme toggle in user menu
8. **Analytics**: Event attendance tracking, conversion metrics
9. **Payment Integration**: Paid event tickets
10. **Accessibility**: WCAG 2.1 AA compliance improvements

---

## 17. Known Limitations

1. **Backend userId field**: Currently optional in CreateEventRequest. Backend should enforce it as required for proper ownership tracking.
2. **Comment/Reaction author info**: Uses authorName/authorEmail instead of userId. Consider standardizing to userId for better ownership control.
3. **Offline support**: No service worker or offline fallback for event data.
4. **Real-time**: No WebSocket support for live updates; page must be refreshed to see new reactions/comments.
5. **Pagination**: All events loaded at once; no lazy loading for large datasets.
6. **Images**: No client-side image compression before upload.

---

## Conclusion

This event management system provides a complete social experience for event discovery, creation, and engagement. Users can create events, react with emojis, comment, track participants, and manage their own events through an intuitive English UI. The architecture separates concerns between components, services, and backend API, enabling easy maintenance and future enhancements.

For questions or issues, refer to the respective component/service documentation or backend API Swagger/OpenAPI specification.
