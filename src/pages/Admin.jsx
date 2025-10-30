import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ShieldCheck, Package, Flower2, Sparkles, BarChart3 } from "lucide-react";

import Dashboard from "../components/admin/Dashboard";
import OrdersManagement from "../components/admin/OrdersManagement";
import BouquetsManagement from "../components/admin/BouquetsManagement";
import FlowersManagement from "../components/admin/FlowersManagement";

export default function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser.role !== 'admin') {
          navigate(createPageUrl("Home"));
        } else {
          setUser(currentUser);
        }
      } catch (error) {
        navigate(createPageUrl("Home"));
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [navigate]);

  const handleNavigateToTab = (tab) => {
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-pink-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Панель администратора
            </h1>
            <p className="text-gray-600 mt-1">Добро пожаловать, {user?.full_name || 'Админ'}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white rounded-2xl p-1 shadow-lg mb-8">
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-xl"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Статистика</span>
            </TabsTrigger>
            <TabsTrigger 
              value="orders"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-xl"
            >
              <Package className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Заказы</span>
            </TabsTrigger>
            <TabsTrigger 
              value="bouquets"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-xl"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Букеты</span>
            </TabsTrigger>
            <TabsTrigger 
              value="flowers"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-xl"
            >
              <Flower2 className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Цветы</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard onNavigateToTab={handleNavigateToTab} />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersManagement />
          </TabsContent>

          <TabsContent value="bouquets">
            <BouquetsManagement />
          </TabsContent>

          <TabsContent value="flowers">
            <FlowersManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}