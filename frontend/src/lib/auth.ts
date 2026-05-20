import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import prisma from './prisma'
import jwt from 'jsonwebtoken'
import { headers } from 'next/headers'

const { handlers, auth: nextAuth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            clientProfile: true,
            mentorProfile: {
              include: {
                assignments: {
                  where: { isActive: true },
                  select: { clientProfileId: true, permissions: true }
                }
              }
            }
          }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        // Check if temporary mentor has expired
        if (user.mentorProfile?.type === 'TEMPORARY' && user.mentorProfile.accessEnd) {
          if (new Date() > user.mentorProfile.accessEnd) {
            return null // Access expired
          }
        }

        // Check if mentor is suspended
        if (user.mentorProfile?.status === 'SUSPENDED') {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          clientProfileId: user.clientProfile?.id || null,
          mentorProfileId: user.mentorProfile?.id || null,
          mentorType: user.mentorProfile?.type || null,
          assignedClients: user.mentorProfile?.assignments?.map(a => ({
            clientProfileId: a.clientProfileId,
            permissions: a.permissions
          })) || []
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.clientProfileId = user.clientProfileId
        token.mentorProfileId = user.mentorProfileId
        token.mentorType = user.mentorType
        token.assignedClients = user.assignedClients
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.clientProfileId = token.clientProfileId as string | null
        session.user.mentorProfileId = token.mentorProfileId as string | null
        session.user.mentorType = token.mentorType as string | null
        session.user.assignedClients = token.assignedClients as any[] || []
      }
      return session
    }
  },
  pages: {
    signIn: '/login'
  },
  session: {
    strategy: 'jwt'
  }
})

export { handlers, signIn, signOut }

const checkBearerToken = async () => {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback_secret_for_development') as any;

      if (decoded && decoded.id) {
        return {
          user: decoded,
          expires: new Date((decoded.exp || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60) * 1000).toISOString()
        } as any;
      }
    }
  } catch (err) {
    // Silent fail for token verification
  }

  return null;
}

const customAuth = (...args: any[]) => {
  if (args.length === 0) {
    return (async () => {
      try {
        const session = await (nextAuth as any)();
        if (session) return session;
      } catch (err) { }
      return checkBearerToken();
    })();
  }
  return (nextAuth as any)(...args);
}

export const auth = customAuth as any;
