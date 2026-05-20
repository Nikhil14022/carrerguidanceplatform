# Backend Handover: Career Guidance Platform

This folder contains the complete blueprint for building the backend functionalities of the Career Guidance Platform. The frontend is already scaffolded using Next.js 16 (App Router) and Tailwind v4.

## 🛠 Target Tech Stack
- **Database:** MongoDB Atlas (via Prisma ORM)
- **Auth:** NextAuth.js (Credentials Provider)
- **AI:** Google Gemini API (via `@google/generative-ai`)
- **Validation:** Zod

## 📂 Folder Structure
- `PRISMA_SCHEMA.txt`: Database models and relationships.
- `API_SPECS.md`: List of required endpoints, methods, and expected data.
- `AI_LOGIC.md`: Details on the Gemini AI report generation process.
- `SECURITY_ROLES.md`: Specification for RBAC (Client, Parent, Admin, Expert).

## 🚀 Priority Build Order
1. **DB & Auth:** Setup Prisma and NextAuth. Verify role-based middleware.
2. **Module System:** Implement the dynamic question/response logic.
3. **Admin Controls:** Build the review, approve, and reorder logic.
4. **AI Engine:** Integrate Gemini for career report generation.

## 💡 Key Integration Notes
The frontend expects a "Sleek Intelligence" UI. When building APIs, ensure you return clean, structured JSON that the Next.js Client Components can easily consume. Standard fetch patterns are being used.
