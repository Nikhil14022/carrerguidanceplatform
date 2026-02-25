# Stage-Based Client Journey Platform

A comprehensive web platform for managing client lifecycles through structured, stage-driven workflows with role-based access control.

## Overview

This platform digitizes the entire client journey from onboarding to completion, featuring:
- **Stage-Based Progression**: Clients move through controlled, locked stages
- **Smart Questionnaires**: Collect detailed information at each stage
- **Team Collaboration**: Internal team workflows and meeting notes
- **Professional Reports**: Generate PDF reports with insights
- **Action Planning**: Create structured next steps for clients
- **Role-Based Access**: Client, Team Member, and Admin roles

## Tech Stack

### Frontend
- **React 19**: Modern UI library
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first styling with custom design system
- **Shadcn/UI**: High-quality component library
- **Lucide React**: Modern icon library
- **Sonner**: Toast notifications

### Backend
- **FastAPI**: High-performance Python API framework
- **MongoDB**: NoSQL database via Motor (async driver)
- **ReportLab**: PDF generation
- **Emergent OAuth**: Google-based authentication

### Design System
- **Primary Color**: Forest Green (#1A4D2E) - Trust and growth
- **Secondary**: Bone White (#F2F4F3) - Warm background
- **Accent**: Warm Terracotta (#E07A5F) - Call-to-action
- **Typography**: Outfit (headings), Inter (body)
- **Visual Metaphor**: Timeline with connected nodes

## Features

### 1. Authentication
- Google OAuth via Emergent integration
- Session management with secure cookies
- Role-based access control

### 2. Client Journey
- **5 Predefined Stages**:
  1. Initial Assessment
  2. Deep Dive Analysis (requires meeting)
  3. Strategy Development (requires meeting)
  4. Action Planning
  5. Review & Completion (requires meeting)
- Locked progression (must complete current stage)
- Visual progress tracker
- Auto-created client profile on registration

### 3. Questionnaires
- Multiple question types: text, textarea, multiple choice, scale (1-10)
- Required/optional fields
- Response persistence and editing

### 4. Team Dashboard
- View all clients
- Search and filter capabilities
- Client progress monitoring
- Statistics: Total clients, active clients, average progress

### 5. Client Profile (Team View)
- Comprehensive client data
- Four main tabs: Responses, Meetings, Reports, Action Plans
- Approve and advance clients to next stage

### 6. Report Generation
- Professional PDF reports with client info, responses, and recommendations
- Downloadable from both client and team dashboards

### 7. Admin Panel
- User management
- Role assignment (client/team/admin)
- Stage configuration

## Getting Started

### Testing
See `/app/auth_testing.md` for authentication testing instructions.

### API Documentation
Full API documentation available at `/api/docs` when running.

## Key Endpoints

- `POST /api/auth/session` - Create session
- `GET /api/auth/me` - Get current user
- `GET /api/clients` - List clients
- `GET /api/stages` - List stages
- `POST /api/responses` - Submit response
- `POST /api/clients/{client_id}/generate-report` - Generate PDF report

## Security Features

- Session-based authentication with httpOnly cookies
- 7-day session expiration
- Role-based API access control
- Timezone-aware datetime handling

## Future Enhancements

- AI-powered insights
- CRM integrations
- Email notifications
- Multi-language support
- Advanced analytics

For detailed documentation, see the main README file.
