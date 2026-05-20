import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Role hierarchy: SUPER_ADMIN > ADMIN > MENTOR_PERMANENT > MENTOR_TEMPORARY > CLIENT/PARENT
const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];
const MENTOR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MENTOR_PERMANENT', 'MENTOR_TEMPORARY', 'EXPERT'];

export type Permission = 'VIEW_MODULES' | 'REVIEW_MODULES' | 'VIEW_REPORTS' | 'EDIT_REPORTS' | 'CHAT';

/**
 * Check if the current user has admin-level access (Super Admin or legacy Admin)
 */
export async function requireAdmin() {
    const session = await auth();
    if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
        return { error: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }), session: null };
    }
    return { error: null, session };
}

/**
 * Check if the current user is a mentor (any type) or admin
 */
export async function requireMentor() {
    const session = await auth();
    if (!session?.user || !MENTOR_ROLES.includes(session.user.role)) {
        return { error: NextResponse.json({ error: 'Forbidden: Mentor access required' }, { status: 403 }), session: null };
    }
    return { error: null, session };
}

/**
 * Check if the current user is authenticated (any role)
 */
export async function requireAuth() {
    const session = await auth();
    if (!session?.user) {
        return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null };
    }
    return { error: null, session };
}

/**
 * Check if a mentor has access to a specific client
 */
export function mentorHasClientAccess(session: any, clientProfileId: string): boolean {
    if (ADMIN_ROLES.includes(session.user.role)) return true;
    const assignments = session.user.assignedClients || [];
    return assignments.some((a: any) => a.clientProfileId === clientProfileId);
}

/**
 * Check if a mentor has a specific permission for a client
 */
export function mentorHasPermission(session: any, clientProfileId: string, permission: Permission): boolean {
    if (ADMIN_ROLES.includes(session.user.role)) return true;
    const assignments = session.user.assignedClients || [];
    const assignment = assignments.find((a: any) => a.clientProfileId === clientProfileId);
    if (!assignment) return false;
    return assignment.permissions.includes(permission);
}
