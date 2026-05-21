import { useEffect, type ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSubscriptionStore } from './store';
import type { SubscriptionFeature } from './types';
import PaymentModal from './components/PaymentModal';

/**
 * Purge stale localStorage subscription data on startup.
 * The store no longer persists to localStorage, so any old
 * cached 'reborn-subscription' key must be removed to prevent
 * phantom PRO states from a previous session.
 */
function purgeStaleCache() {
  try {
    localStorage.removeItem('reborn-subscription');
  } catch {
    // localStorage may be unavailable (e.g. incognito)
  }
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, loading, refreshUser } = useAuth();
  const syncFromUser = useSubscriptionStore((state) => state.syncFromUser);
  const fetchStatus = useSubscriptionStore((state) => state.fetchStatus);
  const setOnPaymentSuccess = useSubscriptionStore((state) => state._setOnPaymentSuccess);

  // Purge stale localStorage on first mount
  useEffect(() => {
    purgeStaleCache();
  }, []);

  useEffect(() => {
    setOnPaymentSuccess(async () => {
      await refreshUser();
    });
  }, [setOnPaymentSuccess, refreshUser]);

  useEffect(() => {
    if (loading) return;

    // Sync plan from the user object returned by /auth/me (backend truth)
    syncFromUser(user);

    // Also fetch from /subscription/status for richer feature-gate data
    if (user) {
      fetchStatus().catch(() => {
        // fetchStatus failed — syncFromUser already set the correct plan.
      });
    }
  }, [fetchStatus, loading, syncFromUser, user?.id, user?.subscription_plan]);

  return (
    <>
      <PaymentModal />
      {children}
    </>
  );
}

export function useSubscription() {
  const store = useSubscriptionStore();
  return {
    ...store,
    isPro: store.plan === 'pro',
    isProcessing: ['loading', 'redirecting', 'confirming'].includes(store.status),
    startPayment: () => store.startUpgrade(),
    refetchUserStatus: store.fetchStatus,
    getFeatureGate: (feature: SubscriptionFeature) => store.getGate(feature),
    hasFeatureAccess: (feature: SubscriptionFeature) => store.canAccess(feature),
  };
}

