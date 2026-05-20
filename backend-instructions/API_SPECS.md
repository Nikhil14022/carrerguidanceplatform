# API Specifications

## 🔑 Authentication (`/api/auth/*`)
- **POST `/api/auth/login`**: NextAuth session handling.
- **POST `/api/auth/register`**: Client account creation.
- **GET `/api/auth/session`**: Current user role/profile retrieval.

## 🚀 Client Journey (`/api/client/*`)
- **GET `/api/client/dashboard`**: Fetch journey progress, current active module, and stats.
- **GET `/api/client/modules`**: List all assigned modules with status.
- **GET `/api/client/modules/[id]`**: Fetch specific module schema + draft data.
- **POST `/api/client/modules/[id]/save`**: Auto-save draft logic.
- **POST `/api/client/modules/[id]/submit`**: Submit module for review (status -> SUBMITTED).
- **GET `/api/client/reports`**: Fetch finalized reports.

## 🛠 Admin Panel (`/api/admin/*`)
- **GET `/api/admin/clients`**: List all clients with stage filters.
- **GET `/api/admin/clients/[id]`**: Full profile + journey history.
- **POST `/api/admin/modules/[moduleId]/review`**: Approve/Reject module response.
- **POST `/api/admin/modules/reorder`**: Global reordering of module templates.
- **POST `/api/admin/clients/[id]/manage`**: Per-client manual reordering/skipping/adding.
- **POST `/api/admin/clients/[id]/generate-report`**: Trigger Gemini AI report generation.
- **PATCH `/api/admin/reports/[reportId]`**: Edit/Update report text before finalization.
- **POST `/api/admin/reports/[reportId]/finalize`**: Mark as FINALIZED (visible to client).

## 👨‍👩‍👦 Parent Portal (`/api/parent/*`)
- **GET `/api/parent/dashboard`**: Summary of child's completion stats.
- **GET `/api/parent/progress`**: Module status timeline (Privacy: No answer content).
