

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Home, Sparkles, ShoppingBag, ShoppingCart, History, User, ShieldCheck, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";

function SidebarNavigation({ navigationItems, location, user, newOrdersCount }) {
  const { setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    // Закрываем sidebar на мобильных устройствах
    if (window.innerWidth < 768) {
      setOpenMobile(false);
    }
  };

  return (
    <>
      <SidebarHeader className="border-b border-pink-100 p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-400 rounded-2xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              FlowerDream
            </h2>
            <p className="text-xs text-gray-500">Цветы с любовью</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className={`hover:bg-pink-50 hover:text-pink-700 transition-all duration-200 rounded-xl mb-1 ${
                      location.pathname === item.url ? 'bg-gradient-to-r from-pink-50 to-purple-50 text-pink-700 shadow-sm' : ''
                    }`}
                  >
                    <Link to={item.url} onClick={handleLinkClick} className="flex items-center gap-3 px-4 py-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium flex-1">{item.title}</span>
                      {item.badge > 0 && (
                        <Badge className={item.badgeColor}>
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-pink-100 p-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 text-sm truncate">
              {user?.full_name || 'Гость'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.role === 'admin' ? 'Администратор' : 'Добро пожаловать'}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </>
  );
}

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  const { data: newOrdersCount = 0 } = useQuery({
    queryKey: ['new-orders-count'],
    queryFn: async () => {
      if (user?.role !== 'admin') return 0;
      const orders = await base44.entities.Order.filter({ status: 'новый' });
      return orders.length;
    },
    enabled: user?.role === 'admin',
    refetchInterval: 3000,
    initialData: 0,
  });

  const { data: unreadNotificationsCount = 0 } = useQuery({
    queryKey: ['unread-notifications-count', user?.email],
    queryFn: async () => {
      if (!user?.email) return 0;
      const notifications = await base44.entities.Notification.filter({ 
        user_email: user.email, 
        is_read: false 
      });
      return notifications.length;
    },
    enabled: !!user?.email,
    refetchInterval: 5000,
    initialData: 0,
  });

  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartCount(cart.length);
    };

    updateCartCount();
    
    window.addEventListener("storage", updateCartCount);
    const interval = setInterval(updateCartCount, 500);

    return () => {
      window.removeEventListener("storage", updateCartCount);
      clearInterval(interval);
    };
  }, [location]);

  const navigationItems = [
    {
      title: "Главная",
      url: createPageUrl("Home"),
      icon: Home,
    },
    {
      title: "Конструктор",
      url: createPageUrl("BouquetBuilder"),
      icon: Sparkles,
    },
    {
      title: "Корзина",
      url: createPageUrl("Cart"),
      icon: ShoppingBag,
      badge: cartCount,
      badgeColor: "bg-gradient-to-r from-pink-500 to-purple-500 text-white",
    },
    {
      title: "Мои заказы",
      url: createPageUrl("Orders"),
      icon: History,
    },
    {
      title: "Уведомления",
      url: createPageUrl("Notifications"),
      icon: Bell,
      badge: unreadNotificationsCount,
      badgeColor: "bg-gradient-to-r from-blue-500 to-indigo-500 text-white animate-pulse",
    },
  ];

  if (user?.role === 'admin') {
    navigationItems.push({
      title: "Админ панель",
      url: createPageUrl("Admin"),
      icon: ShieldCheck,
      badge: newOrdersCount,
      badgeColor: "bg-blue-500 text-white animate-pulse",
    });
  }

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --primary: #ec4899;
          --primary-light: #fdf2f8;
          --secondary: #a78bfa;
          --accent: #34d399;
          --background: #fefefe;
          --text: #1f2937;
        }
      `}</style>
      <div className="min-h-screen flex w-full" style={{ background: 'linear-gradient(to bottom right, #fef3f8, #fefefe, #f0fdf9)' }}>
        <Sidebar className="border-r border-pink-100 bg-white/80 backdrop-blur-sm">
          <SidebarNavigation 
            navigationItems={navigationItems}
            location={location}
            user={user}
            newOrdersCount={newOrdersCount}
          />
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100 px-6 py-4 md:hidden sticky top-0 z-50 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-pink-50 p-2 rounded-lg transition-colors duration-200" />
                <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  FlowerDream
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(createPageUrl("Notifications"))}
                  className="relative hover:bg-blue-50 rounded-full"
                >
                  <Bell className="w-5 h-5 text-blue-600" />
                  {unreadNotificationsCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs animate-pulse">
                      {unreadNotificationsCount}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(createPageUrl("Cart"))}
                  className="relative hover:bg-pink-50 rounded-full"
                >
                  <ShoppingCart className="w-5 h-5 text-pink-600" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs">
                      {cartCount}
                    </Badge>
                  )}
                </Button>
                {user?.role === 'admin' && newOrdersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(createPageUrl("Admin"))}
                    className="relative hover:bg-blue-50 rounded-full"
                  >
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-blue-500 text-white text-xs animate-pulse">
                      {newOrdersCount}
                    </Badge>
                  </Button>
                )}
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}

