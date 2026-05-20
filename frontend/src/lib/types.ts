import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    role: string
    clientProfileId?: string | null
    mentorProfileId?: string | null
    mentorType?: string | null
    assignedClients?: { clientProfileId: string; permissions: string[] }[]
  }

  interface Session {
    user: {
      id: string
      role: string
      clientProfileId?: string | null
      mentorProfileId?: string | null
      mentorType?: string | null
      assignedClients?: { clientProfileId: string; permissions: string[] }[]
    } & DefaultSession['user']
  }
}

declare module 'next-auth' {
  interface JWT {
    id: string
    role: string
    clientProfileId?: string | null
    mentorProfileId?: string | null
    mentorType?: string | null
    assignedClients?: { clientProfileId: string; permissions: string[] }[]
  }
}
