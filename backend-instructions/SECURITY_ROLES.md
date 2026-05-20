# Security & Role-Based Access Control (RBAC)

The platform requires strict data isolation and role-based permissions handled via **NextAuth.js** and **Next.js Middleware**.

## 👥 User Roles
1. **CLIENT (Student):**
   - Can fill their own assigned modules.
   - Can view their own finalized reports.
   - Cannot see other students' data.
2. **PARENT:**
   - Linked to a specific ClientProfile.
   - Can see "Journey Progress" (Completion status).
   - **Privacy Restriction:** Cannot see the specific answers/data in their child's modules.
3. **ADMIN:**
   - Full access to all clients and settings.
   - Manages module templates and client journey ordering.
4. **EXPERT:**
   - Can review and approve/reject client module responses.
   - Has read access to client profiles assigned to them.
   - Drafts and edits AI-generated career reports.

## 🛡 Network & Middleware Security
Implement route protection in `middleware.ts`:
- `/dashboard/*` -> Minimum `CLIENT` role.
- `/admin/*` -> Minimum `EXPERT` role.
- `/parent/*` -> Minimum `PARENT` role.

### Data Protection Rules
- **Module Isolation:** A client should only be able to POST responses to `ClientModule` instances that belong to their `userId`.
- **Validation:** Use **Zod** schema validation for all incoming API payloads (Module Responses, Login, registration).
