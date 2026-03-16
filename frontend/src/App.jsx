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
import { API_URL } from './config';
import { services as fallbackServices } from './data/services';

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

function App() {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [user, setUser] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [servicesCatalog, setServicesCatalog] = useState(fallbackServices);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState({});
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  const bootTimeoutRef = useRef(null);
  const handledReturnRef = useRef(false);

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

  const fetchUserOrders = async (token) => {
    try {
      const response = await fetch(`${API_URL}/orders/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
        return data.orders;
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
    return [];
  };

  const fetchUserNotifications = async (token) => {
    try {
      const response = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
        return data.notifications;
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
    return [];
  };

  const hydrateAfterAuth = async (token) => {
    await Promise.all([fetchUserOrders(token), fetchUserNotifications(token)]);
  };

  const loadServicesCatalog = async () => {
    try {
      const response = await fetch(`${API_URL}/services`);
      const data = await response.json();
      if (data.success && Array.isArray(data.services) && data.services.length > 0) {
        setServicesCatalog(data.services);
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
      const data = await response.json();

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
      const txRef =
        new URLSearchParams(window.location.search).get('tx_ref') ||
        new URLSearchParams(window.location.search).get('trx_ref');

      await loadServicesCatalog();

      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        tg.disableVerticalSwipes();
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
      await hydrateAfterAuth(savedToken);

      if (cancelled) return;

      if (txRef && !handledReturnRef.current) {
        handledReturnRef.current = true;
        await handleReturnedPayment(savedToken, txRef);
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
          username: tgUser.username
        })
      });

      const data = await response.json();
      if (data.success) {
        persistSession(data.user, data.token);
        setOrders(data.user.orders || []);
        await fetchUserNotifications(data.token);
        setCurrentScreen('home');
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

      const data = await response.json();
      if (data.success) {
        persistSession(data.user, data.token);
        setOrders(data.user.orders || []);
        await fetchUserNotifications(data.token);
        setCurrentScreen('home');
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

      const data = await response.json();
      if (data.success) {
        persistSession(data.user, data.token);
        await hydrateAfterAuth(data.token);
        setCurrentScreen('home');
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

  const handleLogout = () => {
    setUser(null);
    setOrders([]);
    setNotifications([]);
    setSelectedService(null);
    setSelectedPlan(null);
    setPendingCredentials({});
    setConfirmedOrder(null);
    localStorage.removeItem('dinkUser');
    localStorage.removeItem('dinkToken');
    setCurrentScreen('login');
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

        {currentScreen === 'home' && user && (
          <HomeScreen
            key="home"
            user={user}
            services={servicesCatalog}
            orders={orders}
            unreadCount={unreadCount}
            activeOrders={activeOrders}
            onServiceSelect={handleServiceSelect}
            onProfileClick={() => setCurrentScreen('profile')}
            onOrdersClick={() => setCurrentScreen('orders')}
            onNotificationsClick={() => setCurrentScreen('notifications')}
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
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
