# 🏗️ orcastack - System Architecture
## High-Level Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                     (http://localhost:3000)                      │
└─────────────────────────────────────────────────────────────────┘
│
│ HTTP/HTTPS
▼
┌─────────────────────────────────────────────────────────────────┐
│                     REACT FRONTEND (SPA)                         │
│  ┌────────────┬────────────┬────────────┬────────────────────┐ │
│  │   Public   │   Admin    │   Auth     │    API Services     │ │
│  │   Pages    │   Pages    │  Context   │   (Axios Client)    │ │
│  └────────────┴────────────┴────────────┴────────────────────┘ │
│         TailwindCSS Styling │ React Router Navigation          │
└─────────────────────────────────────────────────────────────────┘
│
│ REST API Calls (JSON)
│ Authorization: Bearer <JWT>
▼
┌─────────────────────────────────────────────────────────────────┐
│                   DJANGO REST FRAMEWORK API                      │
│  ┌────────────────────────────────────────────────────────────┐│
│  │                    JWT Authentication                       ││
│  │              (djangorestframework-simplejwt)                ││
│  └────────────────────────────────────────────────────────────┘│
│  ┌─────────────┬──────────────┬──────────────┬───────────────┐│
│  │  Accounts   │  Portfolio   │  Services    │ Testimonials  ││
│  │  ViewSet    │  ViewSet     │  ViewSet     │  ViewSet      ││
│  ├─────────────┼──────────────┼──────────────┼───────────────┤│
│  │  Profile    │  Project     │  Service     │  Testimonial  ││
│  │  Serializer │  Serializer  │  Serializer  │  Serializer   ││
│  └─────────────┴──────────────┴──────────────┴───────────────┘│
│  ┌────────────────────────────────────────────────────────────┐│
│  │                     Contact ViewSet                         ││
│  │                   Inquiry Serializer                        ││
│  └────────────────────────────────────────────────────────────┘│
│                CORS Headers │ Media File Handling              │
└─────────────────────────────────────────────────────────────────┘
│
│ Django ORM
▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE                                 │
│                   (SQLite / PostgreSQL)                         │
│  ┌────────────────────────────────────────────────────────────┐│
│  │  Tables: auth_user, profiles, projects, services,          ││
│  │          testimonials, inquiries                            ││
│  └────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```
## Request Flow Diagrams
### Public User Journey
```
User Opens Homepage
│
▼
┌─────────────────┐
│  Load Profile   │────► GET /api/accounts/profiles/public/
│  Information    │
└─────────────────┘
│
▼
┌─────────────────┐
│  Load Featured  │────► GET /api/portfolio/projects/featured/
│    Projects     │
└─────────────────┘
│
▼
┌─────────────────┐
│  Load Featured  │────► GET /api/testimonials/featured/
│  Testimonials   │
└─────────────────┘
│
▼
Render Page
```
### Admin Login & Management Flow
```
Admin Login
│
▼
┌──────────────────┐
│  Submit Login    │────► POST /api/token/
│   Credentials    │       { username, password }
└──────────────────┘
│
▼
┌──────────────────┐
│  Receive JWT     │◄──── { access, refresh }
│     Tokens       │
└──────────────────┘
│
▼
Store in localStorage
│
▼
┌──────────────────┐
│  Access Admin    │
│    Dashboard     │
└──────────────────┘
│
├──► Manage Projects ──► GET/POST/PUT/DELETE /api/portfolio/projects/
│                         Authorization: Bearer <token>
│
├──► Manage Services ──► GET/POST/PUT/DELETE /api/services/
│                         Authorization: Bearer <token>
│
├──► View Inquiries ───► GET /api/contact/inquiries/
│                         Authorization: Bearer <token>
│
└──► Update Profile ───► PUT /api/accounts/profiles/{id}/
Authorization: Bearer <token>
```
### Contact Form Submission Flow
```
User Fills Form
│
▼
┌──────────────────┐
│  Submit Inquiry  │────► POST /api/contact/inquiries/
│      Data        │       { name, email, message, ... }
└──────────────────┘
│
▼
┌──────────────────┐
│   API Validates  │
│      Data        │
└──────────────────┘
│
▼
┌──────────────────┐
│  Save to DB with │
│    IP & Metadata │
└──────────────────┘
│
▼
┌──────────────────┐
│  Return Success  │◄──── { message, id }
│    Response      │
└──────────────────┘
│
▼
┌──────────────────┐
│ Show Success Msg │
│   Clear Form     │
└──────────────────┘
```
## Data Flow Architecture
### Frontend Data Management
```
┌─────────────────────────────────────────────────┐
│              React Component Tree                │
│                                                  │
│  App.js                                          │
│    │                                             │
│    ├── AuthProvider (Context)                   │
│    │     └── AuthContext (user, login, logout)  │
│    │                                             │
│    ├── Layout                                    │
│    │    ├── Header (Navigation)                 │
│    │    ├── Outlet (Page Content)               │
│    │    └── Footer                               │
│    │                                             │
│    └── Routes                                    │
│         ├── Public Routes                        │
│         │    ├── Home                            │
│         │    ├── About                           │
│         │    ├── Services                        │
│         │    ├── Portfolio                       │
│         │    ├── Testimonials                    │
│         │    └── Contact                         │
│         │                                         │
│         └── Protected Routes (Admin)             │
│              ├── Dashboard                       │
│              ├── Projects Management             │
│              ├── Services Management             │
│              ├── Testimonials Management         │
│              ├── Inquiries Management            │
│              └── Profile Management              │
│                                                  │
└─────────────────────────────────────────────────┘
│
│ API Calls via Axios
▼
┌─────────────────────────────────────────────────┐
│            API Service Layer                     │
│                                                  │
│  api.js (Axios Instance with Interceptors)      │
│    │                                             │
│    ├── Request Interceptor                      │
│    │    └── Add JWT Token to Headers            │
│    │                                             │
│    └── Response Interceptor                     │
│         └── Handle Token Refresh on 401         │
│                                                  │
│  index.js (API Methods)                          │
│    ├── authService                               │
│    ├── profileService                            │
│    ├── projectService                            │
│    ├── serviceService                            │
│    ├── testimonialService                        │
│    └── inquiryService                            │
│                                                  │
└─────────────────────────────────────────────────┘
```
### Backend API Architecture
```
┌─────────────────────────────────────────────────┐
│            Django Project Structure              │
│                                                  │
│  config/                                         │
│    ├── settings.py (Configuration)              │
│    ├── urls.py (Main URL Router)                │
│    └── wsgi.py (WSGI Application)               │
│                                                  │
│  Django Apps:                                    │
│                                                  │
│  accounts/                                       │
│    ├── models.py (Profile)                      │
│    ├── serializers.py (ProfileSerializer)       │
│    ├── views.py (ProfileViewSet)                │
│    └── urls.py                                   │
│                                                  │
│  portfolio/                                      │
│    ├── models.py (Project)                      │
│    ├── serializers.py (ProjectSerializer)       │
│    ├── views.py (ProjectViewSet)                │
│    └── urls.py                                   │
│                                                  │
│  services/                                       │
│    ├── models.py (Service)                      │
│    ├── serializers.py (ServiceSerializer)       │
│    ├── views.py (ServiceViewSet)                │
│    └── urls.py                                   │
│                                                  │
│  testimonials/                                   │
│    ├── models.py (Testimonial)                  │
│    ├── serializers.py (TestimonialSerializer)   │
│    ├── views.py (TestimonialViewSet)            │
│    └── urls.py                                   │
│                                                  │
│  contact/                                        │
│    ├── models.py (Inquiry)                      │
│    ├── serializers.py (InquirySerializer)       │
│    ├── views.py (InquiryViewSet)                │
│    └── urls.py                                   │
│                                                  │
└─────────────────────────────────────────────────┘
```
## Database Schema
```
┌──────────────────┐
│   auth_user      │
│──────────────────│
│ id (PK)          │
│ username         │
│ password         │
│ email            │
│ is_staff         │
│ is_superuser     │
└──────────────────┘
│
│ 1:1
▼
┌──────────────────┐
│   Profile        │
│──────────────────│
│ id (PK)          │
│ user_id (FK)     │
│ full_name        │
│ title            │
│ bio              │
│ about            │
│ avatar           │
│ email            │
│ phone            │
│ skills (JSON)    │
│ is_active        │
└──────────────────┘
┌──────────────────┐
│   Project        │
│──────────────────│
│ id (PK)          │
│ title            │
│ description      │
│ category         │
│ technologies     │
│ thumbnail        │
│ live_url         │
│ github_url       │
│ is_featured      │
│ is_published     │
│ order            │
└──────────────────┘
┌──────────────────┐
│   Service        │
│──────────────────│
│ id (PK)          │
│ title            │
│ description      │
│ icon             │
│ features (JSON)  │
│ pricing          │
│ is_active        │
│ order            │
└──────────────────┘
┌──────────────────┐
│  Testimonial     │
│──────────────────│
│ id (PK)          │
│ client_name      │
│ client_title     │
│ client_company   │
│ client_avatar    │
│ content          │
│ rating           │
│ is_featured      │
│ is_published     │
└──────────────────┘
┌──────────────────┐
│    Inquiry       │
│──────────────────│
│ id (PK)          │
│ name             │
│ email            │
│ phone            │
│ company          │
│ inquiry_type     │
│ subject          │
│ message          │
│ budget           │
│ status           │
│ ip_address       │
│ created_at       │
└──────────────────┘
```
## Deployment Architecture
### Production Setup
```
┌─────────────────────────────────────────────────┐
│              Internet / Users                    │
└─────────────────────────────────────────────────┘
│
┌──────────────┴──────────────┐
│                             │
▼                             ▼
┌───────────────┐            ┌────────────────┐
│   CDN / Edge  │            │  CDN / Edge    │
│   (Frontend)  │            │  (Frontend)    │
│               │            │                │
│  Netlify or   │            │  Vercel        │
│  Vercel       │            │                │
└───────────────┘            └────────────────┘
│                             │
│                             │
└──────────────┬──────────────┘
│
│ HTTPS REST API
▼
┌──────────────────────────┐
│    Backend Server        │
│  (Django + Gunicorn)     │
│                          │
│  Render / Railway /      │
│  Heroku / AWS            │
└──────────────────────────┘
│
│ Database Connection
▼
┌──────────────────────────┐
│   PostgreSQL Database    │
│                          │
│  Managed DB Service      │
└──────────────────────────┘
│
│ Media Storage
▼
┌──────────────────────────┐
│   Object Storage         │
│   (AWS S3 / Similar)     │
│                          │
│   Images & Files         │
└──────────────────────────┘
```
## Security Architecture
```
┌─────────────────────────────────────────────────┐
│              Security Layers                     │
│                                                  │
│  1. HTTPS/SSL Encryption                         │
│     └── All traffic encrypted in transit        │
│                                                  │
│  2. CORS Protection                              │
│     └── Only allowed origins can access API     │
│                                                  │
│  3. JWT Authentication                           │
│     ├── Access tokens (1 hour expiry)           │
│     ├── Refresh tokens (7 days expiry)          │
│     └── Token rotation on refresh               │
│                                                  │
│  4. Permission Classes                           │
│     ├── Public: AllowAny                         │
│     └── Admin: IsAdminOrReadOnly                 │
│                                                  │
│  5. Django Security                              │
│     ├── CSRF Protection                          │
│     ├── SQL Injection Protection (ORM)          │
│     ├── XSS Protection                           │
│     └── Password Hashing (PBKDF2)               │
│                                                  │
│  6. Input Validation                             │
│     ├── Serializer validation                    │
│     ├── Model field validation                   │
│     └── Form validation on frontend             │
│                                                  │
│  7. Rate Limiting (Optional)                     │
│     └── DRF throttling classes                   │
│                                                  │
└─────────────────────────────────────────────────┘
```
---
**This architecture provides:**
-  Scalable separation of concerns
-  RESTful API design
-  Secure authentication
-  Responsive frontend
-  Easy deployment
-  Maintainable codebase
