import { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { 
  collection, doc, setDoc, onSnapshot, serverTimestamp 
} from 'firebase/firestore';

export interface PresenceUser {
  userId: string;
  userName: string;
  userRole?: string;
  groupId?: string;
  lastSeen?: any;
  isOnline: boolean;
}

/**
 * Update user's online heartbeat in Firestore
 */
export async function updateUserPresence(groupId: string = 'community') {
  const user = auth.currentUser;
  const uid = user?.uid || (typeof localStorage !== 'undefined' ? localStorage.getItem('mw_anonymous_uid') : null) || 'anon_' + Math.random().toString(36).substring(2, 9);
  
  if (typeof localStorage !== 'undefined' && !localStorage.getItem('mw_anonymous_uid')) {
    localStorage.setItem('mw_anonymous_uid', uid);
  }

  const displayName = user?.displayName || (typeof localStorage !== 'undefined' ? localStorage.getItem('mw_user_name') : null) || 'Student Scholar';
  
  try {
    const presenceRef = doc(db, 'user_presence', uid);
    await setDoc(presenceRef, {
      userId: uid,
      userName: displayName,
      userRole: 'student',
      groupId: groupId,
      lastSeen: serverTimestamp(),
      isOnline: true
    }, { merge: true });
  } catch (err) {
    // Fail silently if offline or blocked
  }
}

/**
 * Real-time Hook to track online users in community or specific study group
 */
export function useOnlinePresence(activeGroupId?: string) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [globalOnlineCount, setGlobalOnlineCount] = useState<number>(1);
  const [groupOnlineCount, setGroupOnlineCount] = useState<number>(1);

  useEffect(() => {
    // 1. Immediately record presence
    updateUserPresence(activeGroupId || 'community');

    // 2. Heartbeat every 40 seconds
    const interval = setInterval(() => {
      updateUserPresence(activeGroupId || 'community');
    }, 40000);

    // 3. Listen to all online presence records
    let isMounted = true;
    const presenceCol = collection(db, 'user_presence');
    const unsubscribe = onSnapshot(presenceCol, (snapshot) => {
      if (!isMounted) return;
      const nowMs = Date.now();
      const cutoffTime = nowMs - (5 * 60 * 1000); // Active in last 5 minutes

      const activeList: PresenceUser[] = [];
      let inCurrentGroup = 0;

      snapshot.docs.forEach((d) => {
        const data = d.data();
        let lastSeenMs = nowMs;
        if (data.lastSeen) {
          if (typeof data.lastSeen.toMillis === 'function') {
            lastSeenMs = data.lastSeen.toMillis();
          } else if (data.lastSeen.seconds) {
            lastSeenMs = data.lastSeen.seconds * 1000;
          } else if (typeof data.lastSeen === 'string' || typeof data.lastSeen === 'number') {
            lastSeenMs = new Date(data.lastSeen).getTime();
          }
        }

        // Within 5 minutes and marked isOnline
        if (lastSeenMs >= cutoffTime && data.isOnline !== false) {
          const userObj: PresenceUser = {
            userId: data.userId || d.id,
            userName: data.userName || 'Student',
            userRole: data.userRole || 'student',
            groupId: data.groupId || 'community',
            lastSeen: data.lastSeen,
            isOnline: true
          };
          activeList.push(userObj);

          if (activeGroupId && data.groupId === activeGroupId) {
            inCurrentGroup++;
          }
        }
      });

      // Ensure at least 1 (the current user) is accounted for
      const finalCount = Math.max(1, activeList.length);
      const groupCount = activeGroupId ? Math.max(1, inCurrentGroup) : finalCount;

      setOnlineUsers(activeList);
      setGlobalOnlineCount(finalCount);
      setGroupOnlineCount(groupCount);
    }, (err) => {
      console.warn("Presence snapshot notice:", err);
      // Fallback
      if (isMounted) {
        setGlobalOnlineCount(1);
        setGroupOnlineCount(1);
      }
    });

    return () => {
      isMounted = false;
      clearInterval(interval);
      unsubscribe();
    };
  }, [activeGroupId]);

  return {
    onlineUsers,
    globalOnlineCount,
    groupOnlineCount
  };
}

/**
 * Format timestamp accurately for real-time chat and feed posts
 */
export function formatRealTime(timestamp: any, fallbackText?: string): string {
  if (!timestamp) {
    return fallbackText || 'Just now';
  }

  let date: Date;
  if (typeof timestamp.toMillis === 'function') {
    date = new Date(timestamp.toMillis());
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    return fallbackText || 'Just now';
  }

  if (isNaN(date.getTime())) {
    return fallbackText || 'Just now';
  }

  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 45) {
    return 'Just now';
  }

  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // If today
  const isToday = now.toDateString() === date.toDateString();
  if (isToday) {
    return timeString;
  }

  // If yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) {
    return `Yesterday, ${timeString}`;
  }

  // If within last 6 days
  if (diffSeconds < 6 * 86400) {
    const dayName = date.toLocaleDateString([], { weekday: 'short' });
    return `${dayName}, ${timeString}`;
  }

  // Older
  const dateString = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `${dateString}, ${timeString}`;
}
