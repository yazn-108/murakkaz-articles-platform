import NextAuth, { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
  interface JWT {
    userId?: number;
  }
}
export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      issuer: "https://github.com/login/oauth",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      return user.id === process.env.ADMIN_ID;
    },
    async jwt({ token, account, profile }) {
      if (account && profile && "id" in profile) {
        token.userId = profile.id as number;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as number;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

