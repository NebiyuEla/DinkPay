import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import './styles/global.css';

import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ServiceDetailScreen from './screens/ServiceDetailScreen';
import CredentialScreen from './screens/CredentialScreen';
import PaymentScreen from './screens/PaymentScreen';
import ProcessingScreen from './screens/ProcessingScreen';
import ConfirmationScreen from './screens/ConfirmationScreen';
import OrdersScreen from './screens/OrdersScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import TermsScreen from './screens/TermsScreen';
import ReferralScreen from './screens/ReferralScreen';
import { API_URL } from './config';
import { services as fallbackServices } from './data/services';
import { TERMS_VERSION_KEY } from './data/legal';
import { applyServiceDiscounts } from './utils/pricing';

const normalizeUiMessage = (value, fallback) => {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (value && typeof value === 'object') {
    if (typeof value.message === 'string' && value.message.trim()) {
      return value.message;
    }

    const parts = Object.values(value).filter((entry) => typeof entry === 'string' && entry.trim());
    if (parts.length > 0) {
      return parts.join(', ');
    }
  }

  return fallback;
};

const readApiPayload = async (response, fallbackMessage) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(normalizeUiMessage(data.message, fallbackMessage));
    }
    return data;
  }

  const text = await response.text().catch(() => '');
  const looksLikeHtml = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');

  if (looksLikeHtml) {
    throw new Error('The app is reaching a web page instead of the API. Set VITE_API_URL to your backend /api URL.');
  }

  throw new Error(fallbackMessage);
};

const userNeedsTermsAcceptance = (userData) => userData?.termsAcceptedVersion !== TERMS_VERSION_KEY;
const sortServicesByOrder = (services = []) =>
  applyServiceDiscounts(
    services
      .map((service, index) => ({ service, index }))
      .sort((left, right) => {
        const leftOrder = Number.isFinite(Number(left.service?.sortOrder)) ? Number(left.service.sortOrder) : Number.MAX_SAFE_INTEGER;
        const rightOrder = Number.isFinite(Number(right.service?.sortOrder)) ? Number(right.service.sortOrder) : Number.MAX_SAFE_INTEGER;

        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder;
        }

        return left.index - right.index;
      })
      .map(({ service }) => service)
  );

function App() {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [user, setUser] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [servicesCatalog, setServicesCatalog] = useState(() => sortServicesByOrder(fallbackServices));
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [termsLoading, setTermsLoading] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState({});
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [termsEntryPoint, setTermsEntryPoint] = useState('auth');

  const bootTimeoutRef = useRef(null);
  const handledReturnRef = useRef(false);
  const launchReferralCodeRef = useRef('');

  const queueScreen = (screen, delay = 900) => {
    window.clearTimeout(bootTimeoutRef.current);
    bootTimeoutRef.current = window.setTimeout(() => {
      setCurrentScreen(screen);
    }, delay);
  };

  const clearPaymentParams = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tx_ref') || params.get('trx_ref') || params.get('payment')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const syncStoredUser = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem('dinkUser', JSON.stringify(nextUser));
  };

  const clearStoredSession = () => {
    setUser(null);
    setOrders([]);
    setNotifications([]);
    setSelectedService(null);
    setSelectedPlan(null);
    setPendingCredentials({});
    setConfirmedOrder(null);
    setTermsEntryPoint('auth');
    localStorage.removeItem('dinkUser');
    localStorage.removeItem('dinkToken');
    setCurrentScreen('login');
  };

  const handleAuthFailureResponse = async (response, fallbackMessage) => {
    if (response.status === 401 || response.status === 403) {
      const data = await response.json().catch(() => ({}));
      clearStoredSession();
      const authError = new Error(normalizeUiMessage(data.message, 'Your account session is no longer active.'));
      authError.code = 'AUTH_INVALID';
      throw authError;
    }

    return readApiPayload(response, fallbackMessage);
  };

  const applyLaunchReferral = async (token) => {
    const referralCode = launchReferralCodeRef.current;
    if (!token || !referralCode) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/referrals/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          code: referralCode,
          source: 'Mini app referral link'
        })
      });

      await handleAuthFailureResponse(response, 'Unable to connect the referral link right now.');
    } catch (error) {
      console.error('Referral apply error:', error);
    } finally {
      launchReferralCodeRef.current = '';
      const params = new URLSearchParams(window.location.search);
      if (params.get('ref')) {
        params.delete('ref');
        const nextQuery = params.toString();
        window.history.replaceState({}, document.title, `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}`);
      }
    }
  };

  const fetchUserOrders = async (token) => {
    try {
      const response = await fetch(`${API_URL}/orders/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await handleAuthFailureResponse(response, 'Unable to load your orders right now.');
      if (data.success) {
        setOrders(data.orders);
        return data.orders;
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error?.code === 'AUTH_INVALID') {
        throw error;
      }
    }
    return [];
  };

  const fetchUserNotifications = async (token) => {
    try {
      const response = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await handleAuthFailureResponse(response, 'Unable to load notifications right now.');
      if (data.success) {
        setNotifications(data.notifications);
        return data.notifications;
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (error?.code === 'AUTH_INVALID') {
        throw error;
      }
    }
    return [];
  };

  const hydrateAfterAuth = async (token) => {
    await Promise.all([fetchUserOrders(token), fetchUserNotifications(token)]);
  };

  const loadServicesCatalog = async () => {
    try {
      const response = await fetch(`${API_URL}/services`);
      const data = await readApiPayload(response, 'Unable to load services right now.');
      if (data.success && Array.isArray(data.services) && data.services.length > 0) {
        setServicesCatalog(sortServicesByOrder(data.services));
      }
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const handleReturnedPayment = async (token, txRef) => {
    setCurrentScreen('processing');

    try {
      const response = await fetch(`${API_URL}/chapa/verify/${encodeURIComponent(txRef)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      const data = await readApiPayload(response, 'Unable to verify payment right now.');

      await hydrateAfterAuth(token);

      if (data.success && data.order) {
        setConfirmedOrder(data.order);
        setCurrentScreen('confirmation');
      } else {
        const fallbackMessage =
          data.paymentState === 'failed'
            ? 'Your payment was not completed. You can try again whenever you are ready.'
            : 'We are still checking your payment. You can come back to your orders after a short moment.';
        alert(normalizeUiMessage(data.message, fallbackMessage));
        setCurrentScreen('home');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      alert(normalizeUiMessage(error.message, 'We could not verify the payment right now. Please check back in a short moment.'));
      setCurrentScreen('home');
    } finally {
      clearPaymentParams();
    }
  };

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const savedUser = localStorage.getItem('dinkUser');
      const savedToken = localStorage.getItem('dinkToken');
      const params = new URLSearchParams(window.location.search);
      const txRef = params.get('tx_ref') || params.get('trx_ref');
      const queryReferralCode = params.get('ref') || '';

      await loadServicesCatalog();

      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        tg.disableVerticalSwipes();
        launchReferralCodeRef.current = tg.initDataUnsafe?.start_param || queryReferralCode || '';
      } else {
        launchReferralCodeRef.current = queryReferralCode || '';
      }

      if (!savedUser || !savedToken) {
        if (txRef) {
          clearPaymentParams();
        }
        if (!cancelled) {
          queueScreen('login');
        }
        return;
      }

      const userData = JSON.parse(savedUser);
      if (cancelled) return;

      setUser(userData);
      try {
        await hydrateAfterAuth(savedToken);
      } catch (error) {
        if (error?.code === 'AUTH_INVALID') {
          return;
        }
        throw error;
      }
      await applyLaunchReferral(savedToken);

      if (cancelled) return;

      if (txRef && !handledReturnRef.current) {
        handledReturnRef.current = true;
        await handleReturnedPayment(savedToken, txRef);
        return;
      }

      if (userNeedsTermsAcceptance(userData)) {
        setTermsEntryPoint('auth');
        queueScreen('terms');
        return;
      }

      queueScreen('home');
    };

    bootstrap();

    return () => {
      cancelled = true;
      window.clearTimeout(bootTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (currentScreen === 'home') {
      loadServicesCatalog();
    }
  }, [currentScreen]);

  useEffect(() => {
    if (!user) return undefined;

    const token = localStorage.getItem('dinkToken');
    const interval = window.setInterval(() => {
      if (!token) return;
      fetchUserOrders(token);
      fetchUserNotifications(token);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [user]);

  const persistSession = (userData, token) => {
    setUser(userData);
    localStorage.setItem('dinkUser', JSON.stringify(userData));
    localStorage.setItem('dinkToken', token);
  };

  const finishAuthFlow = async (userData, token, includeOrdersFromPayload = true) => {
    persistSession(userData, token);
    if (includeOrdersFromPayload) {
      setOrders(userData.orders || []);
    }
    await fetchUserNotifications(token);
    await applyLaunchReferral(token);
    if (userNeedsTermsAcceptance(userData)) {
      setTermsEntryPoint('auth');
      setCurrentScreen('terms');
    } else {
      setCurrentScreen('home');
    }
  };

  const handleTelegramLogin = async () => {
    setIsLoading(true);
    try {
      const tg = window.Telegram?.WebApp;
      if (!tg?.initDataUnsafe?.user) throw new Error('No Telegram user data');

      const tgUser = tg.initDataUnsafe.user;
      const response = await fetch(`${API_URL}/auth/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: tgUser.id,
          firstName: tgUser.first_name,
          lastName: tgUser.last_name || '',
          username: tgUser.username,
          startParam: tg.initDataUnsafe?.start_param || ''
        })
      });

      const data = await readApiPayload(response, 'Unable to continue with Telegram right now.');
      if (data.success) {
        await finishAuthFlow(data.user, data.token, true);
      } else {
        alert(normalizeUiMessage(data.message, 'Unable to continue with Telegram.'));
      }
    } catch (error) {
      console.error('Telegram login error:', error);
      alert(normalizeUiMessage(error.message, 'Telegram login failed. Please try email login.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (userData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await readApiPayload(response, 'Login failed.');
      if (data.success) {
        await finishAuthFlow(data.user, data.token, true);
      } else {
        alert(normalizeUiMessage(data.message, 'Login failed.'));
      }
    } catch (error) {
      console.error('Login error:', error);
      alert(normalizeUiMessage(error.message, 'Login failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (userData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await readApiPayload(response, 'Signup failed.');
      if (data.success) {
        persistSession(data.user, data.token);
        await hydrateAfterAuth(data.token);
        await applyLaunchReferral(data.token);
        if (userNeedsTermsAcceptance(data.user)) {
          setTermsEntryPoint('auth');
          setCurrentScreen('terms');
        } else {
          setCurrentScreen('home');
        }
      } else {
        alert(normalizeUiMessage(data.message, 'Signup failed.'));
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert(normalizeUiMessage(error.message, 'Signup failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptTerms = async () => {
    const token = localStorage.getItem('dinkToken');
    if (!token) return;

    setTermsLoading(true);
    try {
      const response = await fetch(`${API_URL}/user/terms`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          accepted: true,
          version: TERMS_VERSION_KEY
        })
      });

      const data = await readApiPayload(response, 'Unable to save your agreement right now.');
      if (data.success && data.user) {
        const nextUser = { ...user, ...data.user };
        syncStoredUser(nextUser);
        setCurrentScreen(termsEntryPoint === 'profile' ? 'profile' : 'home');
      }
    } catch (error) {
      console.error('Terms acceptance error:', error);
      alert(normalizeUiMessage(error.message, 'Unable to save your agreement right now.'));
    } finally {
      setTermsLoading(false);
    }
  };

  const handleProfileSave = async (payload) => {
    const token = localStorage.getItem('dinkToken');
    if (!token) return;

    setSettingsLoading(true);
    try {
      const response = await fetch(`${API_URL}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await readApiPayload(response, 'Unable to save your profile right now.');
      if (data.success && data.user) {
        const nextUser = { ...user, ...data.user };
        syncStoredUser(nextUser);
        setCurrentScreen('profile');
        alert('Profile updated successfully.');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      alert(normalizeUiMessage(error.message, 'Unable to save your profile right now.'));
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleNotificationRead = async (notificationId) => {
    const token = localStorage.getItem('dinkToken');
    if (!token) return;

    setNotifications((current) =>
      current.map((notification) =>
        notification._id === notificationId ? { ...notification, read: true } : notification
      )
    );

    try {
      await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleAllNotificationsRead = async () => {
    const token = localStorage.getItem('dinkToken');
    if (!token) return;

    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true }))
    );

    try {
      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setSelectedPlan(null);
    setPendingCredentials({});
    setCurrentScreen('service-detail');
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setCurrentScreen('credential');
  };

  const handleCredentialSubmit = (credentials) => {
    setPendingCredentials(credentials);
    setCurrentScreen('payment');
  };

  const openTermsFromProfile = () => {
    setTermsEntryPoint('profile');
    setCurrentScreen('terms');
  };

  const handleLogout = () => {
    clearStoredSession();
  };

  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const activeOrders = orders.filter(
    (order) => order.paymentStatus === 'paid' && !['completed', 'cancelled'].includes(order.status)
  ).length;

  return (
    <div className="app-container" style={{ overflow: 'hidden', height: '100dvh', minHeight: '100vh' }}>
      <AnimatePresence mode="wait">
        {currentScreen === 'splash' && <SplashScreen key="splash" onComplete={() => {}} />}

        {currentScreen === 'login' && !user && (
          <LoginScreen
            key="login"
            onLogin={handleLogin}
            onSignup={handleSignup}
            onTelegramLogin={handleTelegramLogin}
            isLoading={isLoading}
          />
        )}

        {currentScreen === 'terms' && user && (
          <TermsScreen
            key="terms"
            requireAcceptance={userNeedsTermsAcceptance(user)}
            acceptedAt={user?.termsAcceptedAt}
            isLoading={termsLoading}
            onAccept={handleAcceptTerms}
            onBack={termsEntryPoint === 'profile' && !userNeedsTermsAcceptance(user) ? () => setCurrentScreen('profile') : null}
          />
        )}

        {currentScreen === 'home' && user && (
          <HomeScreen
            key="home"
            user={user}
            services={servicesCatalog}
            orders={orders}
            unreadCount={unreadCount}
            activeOrders={activeOrders}
            onServiceSelect={handleServiceSelect}
            onReferralClick={() => setCurrentScreen('referral')}
            onProfileClick={() => setCurrentScreen('profile')}
            onOrdersClick={() => setCurrentScreen('orders')}
            onNotificationsClick={() => setCurrentScreen('notifications')}
          />
        )}

        {currentScreen === 'referral' && user && (
          <ReferralScreen
            key="referral"
            user={user}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'service-detail' && selectedService && (
          <ServiceDetailScreen
            key="service-detail"
            service={selectedService}
            onBack={() => setCurrentScreen('home')}
            onSelectPlan={handlePlanSelect}
          />
        )}

        {currentScreen === 'credential' && selectedService && selectedPlan && (
          <CredentialScreen
            key="credential"
            service={selectedService}
            plan={selectedPlan}
            onBack={() => setCurrentScreen('service-detail')}
            onSubmit={handleCredentialSubmit}
          />
        )}

        {currentScreen === 'payment' && selectedService && selectedPlan && (
          <PaymentScreen
            key="payment"
            service={selectedService}
            plan={selectedPlan}
            pendingCredentials={pendingCredentials}
            onBack={() => setCurrentScreen('credential')}
          />
        )}

        {currentScreen === 'processing' && (
          <ProcessingScreen key="processing" onComplete={() => {}} />
        )}

        {currentScreen === 'confirmation' && confirmedOrder && (
          <ConfirmationScreen
            key="confirmation"
            order={confirmedOrder}
            onHome={() => {
              setConfirmedOrder(null);
              setSelectedService(null);
              setSelectedPlan(null);
              setPendingCredentials({});
              setCurrentScreen('home');
            }}
          />
        )}

        {currentScreen === 'orders' && (
          <OrdersScreen
            key="orders"
            orders={orders}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'notifications' && (
          <NotificationsScreen
            key="notifications"
            notifications={notifications}
            onBack={() => setCurrentScreen('home')}
            markAsRead={handleNotificationRead}
            markAllAsRead={handleAllNotificationsRead}
          />
        )}

        {currentScreen === 'profile' && (
          <ProfileScreen
            key="profile"
            user={user}
            orders={orders}
            onLogout={handleLogout}
            onBack={() => setCurrentScreen('home')}
            onOrdersClick={() => setCurrentScreen('orders')}
            onNotificationsClick={() => setCurrentScreen('notifications')}
            onSettingsClick={() => setCurrentScreen('settings')}
            onTermsClick={openTermsFromProfile}
          />
        )}

        {currentScreen === 'settings' && user && (
          <SettingsScreen
            key="settings"
            user={user}
            isLoading={settingsLoading}
            onBack={() => setCurrentScreen('profile')}
            onSave={handleProfileSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
