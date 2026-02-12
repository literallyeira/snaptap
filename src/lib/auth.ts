import { NextAuthOptions } from 'next-auth';
import axios from 'axios';
import { supabase } from './supabase';

interface GTAWCharacter {
  id: number;
  memberid: number;
  firstname: string;
  lastname: string;
}

interface GTAWUser {
  id: number;
  username: string;
  character: GTAWCharacter[];
}

async function saveUserToSupabase(user: GTAWUser) {
  try {
    await supabase.from('gtaw_users').upsert(
      {
        gtaw_id: user.id,
        username: user.username,
        last_login: new Date().toISOString(),
      },
      { onConflict: 'gtaw_id' }
    );
    for (const char of user.character) {
      await supabase.from('gtaw_characters').upsert(
        {
          character_id: char.id,
          gtaw_user_id: user.id,
          firstname: char.firstname,
          lastname: char.lastname,
        },
        { onConflict: 'character_id' }
      );
    }
  } catch (e) {
    console.error('saveUserToSupabase:', e);
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: 'gtaw',
      name: 'GTA World',
      type: 'oauth',
      authorization: {
        url: 'https://ucp-tr.gta.world/oauth/authorize',
        params: { scope: '', response_type: 'code' },
      },
      token: {
        url: 'https://ucp-tr.gta.world/oauth/token',
        async request({ params, provider }) {
          const redirectUri =
            params.redirect_uri || `${process.env.NEXTAUTH_URL}/api/auth/callback/gtaw`;
          const response = await axios.post(
            'https://ucp-tr.gta.world/oauth/token',
            new URLSearchParams({
              grant_type: 'authorization_code',
              code: params.code as string,
              redirect_uri: String(redirectUri),
              client_id: provider.clientId as string,
              client_secret: provider.clientSecret as string,
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
          );
          return { tokens: response.data };
        },
      },
      userinfo: {
        url: 'https://ucp-tr.gta.world/api/user',
        async request({ tokens }) {
          const res = await axios.get('https://ucp-tr.gta.world/api/user', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          return res.data.user;
        },
      },
      profile(profile) {
        const user = profile as unknown as GTAWUser;
        return {
          id: String(user.id),
          name: user.username,
          gtawId: user.id,
          username: user.username,
          characters: user.character,
        };
      },
      clientId: process.env.GTAW_CLIENT_ID,
      clientSecret: process.env.GTAW_CLIENT_SECRET,
    },
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.gtawId = (user as any).gtawId;
        token.username = (user as any).username;
        token.characters = (user as any).characters;
        const gtawUser = {
          id: (user as any).gtawId,
          username: (user as any).username,
          character: (user as any).characters || [],
        };
        await saveUserToSupabase(gtawUser);
      }
      if (account) token.accessToken = account.access_token;
      return token;
    },
    async session({ session, token }) {
      session.user = session.user || {};
      (session.user as any).gtawId = token.gtawId;
      (session.user as any).username = token.username;
      (session.user as any).characters = token.characters;
      return session;
    },
  },
  pages: { signIn: '/', error: '/' },
  secret: process.env.NEXTAUTH_SECRET,
};
