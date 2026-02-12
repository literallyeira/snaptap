// Test modu: gerçek API gelene kadar kullanılacak mock veriler

export interface MockUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export interface MockSnap {
  id: string;
  fromUserId: string;
  toUserId: string;
  imageUrl: string;
  overlayText?: string;
  createdAt: string;
  viewedAt?: string;
}

export interface MockConversation {
  id: string;
  user: MockUser;
  lastSnap?: MockSnap;
  unreadCount: number;
}

export const MOCK_ME: MockUser = {
  id: 'me',
  username: 'testuser',
  displayName: 'Test Kullanıcı',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
};

export const MOCK_USERS: MockUser[] = [
  {
    id: 'u1',
    username: 'alice',
    displayName: 'Alice',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
  },
  {
    id: 'u2',
    username: 'bob',
    displayName: 'Bob',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
  },
  {
    id: 'u3',
    username: 'cem',
    displayName: 'Cem',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cem',
  },
];

const now = new Date();
const hour = (n: number) => new Date(now.getTime() - n * 60 * 60 * 1000).toISOString();

export const MOCK_SNAPS: MockSnap[] = [
  {
    id: 's1',
    fromUserId: 'u1',
    toUserId: 'me',
    imageUrl: 'https://picsum.photos/400/600?random=1',
    overlayText: 'Naber? 👋',
    createdAt: hour(0.5),
    viewedAt: hour(0.3),
  },
  {
    id: 's2',
    fromUserId: 'me',
    toUserId: 'u1',
    imageUrl: 'https://picsum.photos/400/600?random=2',
    overlayText: 'İyidir sen?',
    createdAt: hour(0.2),
  },
  {
    id: 's3',
    fromUserId: 'u2',
    toUserId: 'me',
    imageUrl: 'https://picsum.photos/400/600?random=3',
    overlayText: 'Bu akşam?',
    createdAt: hour(2),
  },
  {
    id: 's4',
    fromUserId: 'u3',
    toUserId: 'me',
    imageUrl: 'https://picsum.photos/400/600?random=4',
    createdAt: hour(5),
  },
];

export function getMockConversations(): MockConversation[] {
  const byUserId = new Map<string, { user: MockUser; snaps: MockSnap[] }>();
  for (const u of MOCK_USERS) {
    byUserId.set(u.id, { user: u, snaps: [] });
  }
  for (const s of MOCK_SNAPS) {
    if (s.toUserId === 'me') {
      byUserId.get(s.fromUserId)?.snaps.push(s);
    } else if (s.fromUserId === 'me') {
      byUserId.get(s.toUserId)?.snaps.push(s);
    }
  }
  return Array.from(byUserId.entries()).map(([id, { user, snaps }]) => {
    const sorted = [...snaps].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const last = sorted[0];
    const unreadCount = snaps.filter((s) => s.fromUserId !== 'me' && !s.viewedAt).length;
    return {
      id,
      user,
      lastSnap: last,
      unreadCount,
    };
  });
}

export function getMockSnapsWithUser(otherUserId: string): MockSnap[] {
  return MOCK_SNAPS.filter(
    (s) => (s.fromUserId === 'me' && s.toUserId === otherUserId) || (s.fromUserId === otherUserId && s.toUserId === 'me')
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}
