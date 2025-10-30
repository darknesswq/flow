
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, DollarSign, ShoppingBag, TrendingUp, AlertTriangle, Flower2, ChevronRight, X, Clock, User, MapPin, Calendar, Sparkles, Truck, CheckCircle, XCircle, Phone, Star, Store } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";

export default function Dashboard({ onNavigateToTab }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
    initialData: [],
  });

  const { data: bouquets, isLoading: loadingBouquets } = useQuery({
    queryKey: ['admin-bouquets'],
    queryFn: () => base44.entities.Bouquet.list(),
    initialData: [],
  });

  const { data: flowers, isLoading: loadingFlowers } = useQuery({
    queryKey: ['admin-flowers'],
    queryFn: () => base44.entities.Flower.list(),
    initialData: [],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, previousStatus }) => {
      const allOrders = await base44.entities.Order.list();
      const order = allOrders.find(o => o.id === orderId);
      
      if (!order || !order.created_by) {
        throw new Error('Не удалось найти заказ или email получателя');
      }
      
      if (status === 'отменен' && previousStatus !== 'отменен') {
        if (order.items && order.items.length > 0) {
          for (const item of order.items) {
            if (item.type === 'bouquet' && item.item_id) {
              const allBouquets = await base44.entities.Bouquet.list();
              const bouquet = allBouquets.find(b => b.id === item.item_id);
              if (bouquet) {
                await base44.entities.Bouquet.update(bouquet.id, {
                  stock_quantity: (bouquet.stock_quantity || 0) + item.quantity
                });
              }
            } else if (item.type === 'flower' && item.item_id) {
              const allFlowers = await base44.entities.Flower.list();
              const flower = allFlowers.find(f => f.id === item.item_id);
              if (flower) {
                await base44.entities.Flower.update(flower.id, {
                  stock_quantity: (flower.stock_quantity || 0) + item.quantity
                });
              }
            }
          }
        }
        
        if (order.custom_bouquet && order.custom_bouquet.length > 0) {
          const allFlowers = await base44.entities.Flower.list();
          for (const flower of order.custom_bouquet) {
            const flowerEntity = allFlowers.find(f => f.id === flower.flower_id);
            if (flowerEntity) {
              await base44.entities.Flower.update(flowerEntity.id, {
                stock_quantity: (flowerEntity.stock_quantity || 0) + flower.quantity
              });
            }
          }
        }
      }
      
      await base44.entities.Order.update(orderId, { status });
      
      const statusMessages = {
        'новый': { title: 'Заказ создан', message: 'Ваш заказ успешно создан и ожидает обработки' },
        'в_обработке': { title: 'Заказ в обработке', message: 'Ваш заказ принят в обработку' },
        'собирается': { title: 'Заказ собирается', message: 'Флористы начали собирать ваш букет' },
        'в_пути': { title: 'Заказ в пути', message: 'Курьер выехал к вам. Скоро с вами свяжутся для уточнения времени' },
        'доставлен': { title: 'Заказ доставлен', message: 'Ваш заказ успешно доставлен. Оставьте отзыв!' },
        'готов_к_выдаче': { title: 'Заказ готов', message: 'Ваш заказ готов к выдаче. Ждем вас в магазине!' },
        'выдан': { title: 'Заказ выдан', message: 'Спасибо за покупку! Оставьте отзыв!' },
        'отменен': { title: 'Заказ отменен', message: 'Ваш заказ был отменен. Товары возвращены на склад.' }
      };
      
      const statusInfo = statusMessages[status] || { title: 'Статус изменен', message: `Новый статус: ${status}` };
      
      await base44.entities.Notification.create({
        user_email: order.created_by,
        order_id: orderId,
        title: statusInfo.title,
        message: `${statusInfo.message}. Заказ #${orderId.slice(0, 8)}`,
        type: 'order_status',
        order_status: status,
        is_read: false
      });
      
      try {
        await base44.integrations.Core.SendEmail({
          to: order.created_by,
          subject: `FlowerDream: ${statusInfo.title}`,
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(to right, #ec4899, #a855f7); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">FlowerDream</h1>
                <p style="color: white; margin: 10px 0 0 0;">Цветы с любовью</p>
              </div>
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">${statusInfo.title}</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  ${statusInfo.message}
                </p>
                <div style="background: #fce7f3; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #831843;"><strong>Номер заказа:</strong> #${orderId.slice(0, 8)}</p>
                  <p style="margin: 10px 0 0 0; color: #831843;"><strong>Статус:</strong> ${getStatusText(status)}</p>
                  <p style="margin: 10px 0 0 0; color: #831843;"><strong>Получатель:</strong> ${order.created_by}</p>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                  С уважением,<br>
                  Команда FlowerDream
                </p>
              </div>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }
      
      return { orderId, status, recipientEmail: order.created_by };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bouquets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-flowers'] });
      
      // Обновляем данные заказа в модальном окне
      if (selectedOrder) {
        const updatedOrders = await base44.entities.Order.list();
        const updatedOrder = updatedOrders.find(o => o.id === selectedOrder.id);
        if (updatedOrder) {
          setSelectedOrder(updatedOrder);
        }
      }
      
      toast({
        title: "Статус обновлен",
        description: `Уведомление отправлено на ${data.recipientEmail}`,
        duration: 2000,
      });
    },
  });

  const handleStatusChange = (orderId, newStatus) => {
    const order = orders.find(o => o.id === orderId);
    const previousStatus = order?.status;
    updateStatusMutation.mutate({ orderId, status: newStatus, previousStatus });
  };

  const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const newOrders = orders.filter(o => o.status === 'новый').length;
  
  const lowStockFlowers = flowers.filter(f => (f.stock_quantity || 0) < 10 && (f.stock_quantity || 0) > 0);
  const outOfStockFlowers = flowers.filter(f => (f.stock_quantity || 0) === 0);
  const lowStockBouquets = bouquets.filter(b => (b.stock_quantity || 0) < 5 && (b.stock_quantity || 0) > 0);
  const outOfStockBouquets = bouquets.filter(b => (b.stock_quantity || 0) === 0);

  // Сортировка заказов по приоритету статусов
  const statusPriority = {
    'новый': 1,
    'в_обработке': 2,
    'собирается': 3,
    'в_пути': 4,
    'готов_к_выдаче': 5,
    'доставлен': 6,
    'выдан': 7,
    'отменен': 8
  };

  const sortedOrders = [...orders].sort((a, b) => {
    const priorityA = statusPriority[a.status] || 999;
    const priorityB = statusPriority[b.status] || 999;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return new Date(b.created_date) - new Date(a.created_date);
  });

  const recentOrders = sortedOrders.slice(0, 8);

  const getAvailableStatuses = (deliveryType) => {
    const commonStatuses = [
      { value: "новый", label: "Новый", icon: ShoppingBag },
      { value: "в_обработке", label: "В обработке", icon: Clock },
      { value: "собирается", label: "Собирается", icon: Sparkles },
      { value: "отменен", label: "Отменен", icon: XCircle }
    ];

    if (deliveryType === "доставка") {
      return [
        ...commonStatuses,
        { value: "в_пути", label: "В пути", icon: Truck },
        { value: "доставлен", label: "Доставлен", icon: CheckCircle }
      ];
    } else { // самовывоз
      return [
        ...commonStatuses,
        { value: "готов_к_выдаче", label: "Готов к выдаче", icon: Package },
        { value: "выдан", label: "Выдан", icon: CheckCircle }
      ];
    }
  };

  const getNextStatus = (currentStatus, deliveryType) => {
    if (!currentStatus) return null; // Add a check for undefined currentStatus
    if (deliveryType === "доставка") {
      const flow = {
        'новый': 'в_обработке',
        'в_обработке': 'собирается',
        'собирается': 'в_пути',
        'в_пути': 'доставлен'
      };
      return flow[currentStatus] || null;
    } else {
      const flow = {
        'новый': 'в_обработке',
        'в_обработке': 'собирается',
        'собирается': 'готов_к_выдаче',
        'готов_к_выдаче': 'выдан'
      };
      return flow[currentStatus] || null;
    }
  };

  const getNextStatusLabel = (currentStatus, deliveryType) => {
    if (!currentStatus) return null;
    const nextStatus = getNextStatus(currentStatus, deliveryType);
    if (!nextStatus || currentStatus === 'отменен' || currentStatus === 'доставлен' || currentStatus === 'выдан') return null;

    const statusInfo = {
      'в_обработке': {
        label: 'В обработку',
        description: 'Заказ будет принят в работу. Клиенту придет уведомление.',
        icon: Clock
      },
      'собирается': {
        label: 'Начать сборку',
        description: 'Флористы приступят к созданию букета. Клиент получит уведомление.',
        icon: Sparkles
      },
      'в_пути': {
        label: 'Отправить курьера',
        description: 'Курьер выедет к клиенту. Отправится уведомление с просьбой держать телефон под рукой.',
        icon: Truck
      },
      'доставлен': {
        label: 'Отметить доставленным',
        description: 'Заказ успешно доставлен. Клиент получит запрос на оценку.',
        icon: CheckCircle
      },
      'готов_к_выдаче': {
        label: 'Готов к выдаче',
        description: 'Букет готов, клиент может забрать в магазине. Отправится уведомление.',
        icon: Package
      },
      'выдан': {
        label: 'Отметить выданным',
        description: 'Заказ выдан клиенту. Отправится запрос на оценку.',
        icon: CheckCircle
      }
    };

    return {
      ...statusInfo[nextStatus],
      status: nextStatus
    };
  };

  const stats = [
    {
      title: "Всего заказов",
      value: orders.length,
      icon: Package,
      gradient: "from-blue-400 to-blue-600",
      bg: "from-blue-50 to-blue-100"
    },
    {
      title: "Новые заказы",
      value: newOrders,
      icon: TrendingUp,
      gradient: "from-orange-400 to-orange-600",
      bg: "from-orange-50 to-orange-100"
    },
    {
      title: "Общая выручка",
      value: `${totalRevenue.toFixed(0)} ₽`,
      icon: DollarSign,
      gradient: "from-green-400 to-green-600",
      bg: "from-green-50 to-green-100"
    },
    {
      title: "Букетов в каталоге",
      value: bouquets.length,
      icon: ShoppingBag,
      gradient: "from-pink-400 to-purple-600",
      bg: "from-pink-50 to-purple-100"
    }
  ];

  const getBouquetComposition = (bouquetId) => {
    const bouquet = bouquets.find(b => b.id === bouquetId);
    return bouquet?.composition || [];
  };

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`bg-gradient-to-br ${stat.bg} rounded-3xl p-6 shadow-lg`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">{stat.title}</p>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {(lowStockFlowers.length > 0 || outOfStockFlowers.length > 0 || lowStockBouquets.length > 0 || outOfStockBouquets.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <h3 className="text-xl font-bold text-amber-900">Предупреждения о запасах</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {outOfStockFlowers.length > 0 && (
              <div 
                onClick={() => onNavigateToTab('flowers')}
                className="bg-white/80 rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-all duration-300 group border-2 border-transparent hover:border-red-300"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Flower2 className="w-5 h-5 text-red-500" />
                  <p className="font-bold text-red-700 flex-1">Цветы закончились ({outOfStockFlowers.length})</p>
                  <ChevronRight className="w-5 h-5 text-red-500 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="space-y-2">
                  {outOfStockFlowers.slice(0, 3).map((flower) => (
                    <div key={flower.id} className="text-sm text-gray-700 flex items-center justify-between">
                      <span>{flower.name}</span>
                      <Badge className="bg-red-100 text-red-800">0 шт</Badge>
                    </div>
                  ))}
                  {outOfStockFlowers.length > 3 && (
                    <p className="text-xs text-gray-500 italic">и еще {outOfStockFlowers.length - 3}...</p>
                  )}
                </div>
              </div>
            )}

            {lowStockFlowers.length > 0 && (
              <div 
                onClick={() => onNavigateToTab('flowers')}
                className="bg-white/80 rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-all duration-300 group border-2 border-transparent hover:border-amber-300"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Flower2 className="w-5 h-5 text-amber-500" />
                  <p className="font-bold text-amber-700 flex-1">Цветы заканчиваются ({lowStockFlowers.length})</p>
                  <ChevronRight className="w-5 h-5 text-amber-500 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="space-y-2">
                  {lowStockFlowers.slice(0, 3).map((flower) => (
                    <div key={flower.id} className="text-sm text-gray-700 flex items-center justify-between">
                      <span>{flower.name}</span>
                      <Badge className="bg-amber-100 text-amber-800">{flower.stock_quantity} шт</Badge>
                    </div>
                  ))}
                  {lowStockFlowers.length > 3 && (
                    <p className="text-xs text-gray-500 italic">и еще {lowStockFlowers.length - 3}...</p>
                  )}
                </div>
              </div>
            )}

            {outOfStockBouquets.length > 0 && (
              <div 
                onClick={() => onNavigateToTab('bouquets')}
                className="bg-white/80 rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-all duration-300 group border-2 border-transparent hover:border-red-300"
              >
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingBag className="w-5 h-5 text-red-500" />
                  <p className="font-bold text-red-700 flex-1">Букеты закончились ({outOfStockBouquets.length})</p>
                  <ChevronRight className="w-5 h-5 text-red-500 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="space-y-2">
                  {outOfStockBouquets.slice(0, 3).map((bouquet) => (
                    <div key={bouquet.id} className="text-sm text-gray-700 flex items-center justify-between">
                      <span>{bouquet.name}</span>
                      <Badge className="bg-red-100 text-red-800">0 шт</Badge>
                    </div>
                  ))}
                  {outOfStockBouquets.length > 3 && (
                    <p className="text-xs text-gray-500 italic">и еще {outOfStockBouquets.length - 3}...</p>
                  )}
                </div>
              </div>
            )}

            {lowStockBouquets.length > 0 && (
              <div 
                onClick={() => onNavigateToTab('bouquets')}
                className="bg-white/80 rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-all duration-300 group border-2 border-transparent hover:border-amber-300"
              >
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingBag className="w-5 h-5 text-amber-500" />
                  <p className="font-bold text-amber-700 flex-1">Букеты заканчиваются ({lowStockBouquets.length})</p>
                  <ChevronRight className="w-5 h-5 text-amber-500 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="space-y-2">
                  {lowStockBouquets.slice(0, 3).map((bouquet) => (
                    <div key={bouquet.id} className="text-sm text-gray-700 flex items-center justify-between">
                      <span>{bouquet.name}</span>
                      <Badge className="bg-amber-100 text-amber-800">{bouquet.stock_quantity} шт</Badge>
                    </div>
                  ))}
                  {lowStockBouquets.length > 3 && (
                    <p className="text-xs text-gray-500 italic">и еще {lowStockBouquets.length - 3}...</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Последние заказы */}
      <div className="bg-white rounded-3xl shadow-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
            Последние заказы
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const allTab = document.querySelector('[data-value="orders"]');
              if (allTab) allTab.click();
            }}
            className="text-xs sm:text-sm"
          >
            Все заказы
          </Button>
        </div>

        <div className="grid gap-3 sm:gap-4">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:border-pink-300 hover:bg-pink-50/50 transition-all cursor-pointer group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm sm:text-base text-gray-900">#{order.id.slice(0, 8)}</span>
                  <Badge className={getStatusColor(order.status)} size="sm">
                    {getStatusText(order.status)}
                  </Badge>
                  <Badge className={order.delivery_type === "доставка" ? "bg-indigo-100 text-indigo-800" : "bg-purple-100 text-purple-800"} size="sm">
                    {order.delivery_type === "доставка" ? <Truck className="w-3 h-3 mr-1" /> : <Store className="w-3 h-3 mr-1" />}
                    {order.delivery_type}
                  </Badge>
                </div>
                <span className="text-base sm:text-lg font-bold text-pink-600 shrink-0">{order.total_amount} ₽</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  {format(new Date(order.created_date), 'dd MMM, HH:mm', { locale: ru })}
                </span>
                {order.recipient_name && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 sm:w-4 sm:h-4" />
                      {order.recipient_name}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>


      <div className="bg-white rounded-3xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Популярные букеты</h3>
          <div className="space-y-3">
            {bouquets.filter(b => b.is_popular).slice(0, 5).map((bouquet) => (
              <div key={bouquet.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {bouquet.image_url && (
                    <img src={bouquet.image_url} alt={bouquet.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <p className="font-medium text-gray-900 truncate">{bouquet.name}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className="font-bold text-pink-600">{bouquet.price} ₽</p>
                  <Badge className={
                    (bouquet.stock_quantity || 0) === 0 ? "bg-red-100 text-red-800" :
                    (bouquet.stock_quantity || 0) < 5 ? "bg-amber-100 text-amber-800" :
                    "bg-green-100 text-green-800"
                  }>
                    {bouquet.stock_quantity || 0} шт
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

      {/* Модальное окно с деталями заказа */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] md:max-w-3xl max-h-[90vh] overflow-y-auto bg-white p-0">
          {selectedOrder && (
            <>
              <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-purple-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">
                      Заказ #{selectedOrder.id.slice(0, 8)}
                    </DialogTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        {getStatusText(selectedOrder.status)}
                      </Badge>
                      <Badge className={selectedOrder.delivery_type === "доставка" ? "bg-indigo-100 text-indigo-800" : "bg-purple-100 text-purple-800"}>
                        <span className="flex items-center gap-1.5">
                          {selectedOrder.delivery_type === "доставка" ? <Truck className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                          {selectedOrder.delivery_type}
                        </span>
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                      {selectedOrder.total_amount} ₽
                    </p>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 py-4">
                {/* Быстрое действие */}
                {getNextStatusLabel(selectedOrder.status, selectedOrder.delivery_type) && (
                  <motion.div
                    key={selectedOrder.status}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4 sm:p-6"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 mb-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        {React.createElement(
                          getNextStatusLabel(selectedOrder.status, selectedOrder.delivery_type).icon,
                          { className: "w-5 h-5 sm:w-6 sm:h-6 text-white" }
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm sm:text-base font-bold text-blue-900">Следующий шаг</p>
                        <p className="text-xs sm:text-sm text-blue-700 mt-0.5">
                          {getNextStatusLabel(selectedOrder.status, selectedOrder.delivery_type).description}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleStatusChange(
                        selectedOrder.id, 
                        getNextStatusLabel(selectedOrder.status, selectedOrder.delivery_type).status
                      )}
                      disabled={updateStatusMutation.isPending}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl h-10 sm:h-11 text-sm sm:text-base font-medium shadow-lg"
                    >
                      {updateStatusMutation.isPending ? (
                        <>
                          <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                          Обновление...
                        </>
                      ) : (
                        <>
                          {React.createElement(
                            getNextStatusLabel(selectedOrder.status, selectedOrder.delivery_type).icon,
                            { className: "w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" }
                          )}
                          {getNextStatusLabel(selectedOrder.status, selectedOrder.delivery_type).label}
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}

                {/* Информация о заказе */}
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">Информация о заказе</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Создан</p>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 break-words">
                          {format(new Date(selectedOrder.created_date), 'dd MMM yyyy, HH:mm', { locale: ru })}
                        </p>
                      </div>
                    </div>
                    
                    {selectedOrder.recipient_name && (
                      <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Получатель</p>
                          <p className="text-xs sm:text-sm font-medium text-gray-900 break-words">{selectedOrder.recipient_name}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedOrder.recipient_phone && (
                      <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Телефон</p>
                          <p className="text-xs sm:text-sm font-medium text-gray-900 break-words">{selectedOrder.recipient_phone}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedOrder.delivery_address && (
                      <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Адрес доставки</p>
                          <p className="text-xs sm:text-sm font-medium text-gray-900 break-words">{selectedOrder.delivery_address}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedOrder.delivery_date && (
                      <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">
                            {selectedOrder.delivery_type === 'самовывоз' ? 'Дата самовывоза' : 'Дата доставки'}
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-gray-900 break-words">
                            {format(new Date(selectedOrder.delivery_date), 'dd MMMM yyyy', { locale: ru })}
                            {selectedOrder.delivery_time && `, ${selectedOrder.delivery_time}`}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <Package className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Тип получения</p>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 capitalize break-words">{selectedOrder.delivery_type}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Оценка клиента */}
                {(selectedOrder.status === 'доставлен' || selectedOrder.status === 'выдан') && selectedOrder.rating_product && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">Оценка клиента</h4>
                    <div className="p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Star className="w-4 h-4 text-white fill-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-amber-900">Отзыв о заказе</p>
                          {selectedOrder.review_date && (
                            <p className="text-xs text-amber-700">
                              {format(new Date(selectedOrder.review_date), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {/* Оценка товара */}
                        <div className="bg-white/60 rounded-lg p-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs sm:text-sm font-semibold text-gray-700">Качество товара:</span>
                            <div className="flex items-center gap-1.5">
                              <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < selectedOrder.rating_product 
                                        ? 'fill-yellow-400 text-yellow-400' 
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm font-bold text-gray-900 min-w-[2rem] text-right">
                                {selectedOrder.rating_product}/5
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Оценка доставки */}
                        {selectedOrder.delivery_type === 'доставка' && selectedOrder.rating_delivery && (
                          <div className="bg-white/60 rounded-lg p-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs sm:text-sm font-semibold text-gray-700">Качество доставки:</span>
                              <div className="flex items-center gap-1.5">
                                <div className="flex gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < selectedOrder.rating_delivery 
                                          ? 'fill-yellow-400 text-yellow-400' 
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm font-bold text-gray-900 min-w-[2rem] text-right">
                                  {selectedOrder.rating_delivery}/5
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Комментарий */}
                        {selectedOrder.review_comment && (
                          <div className="bg-white/60 rounded-lg p-2">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Комментарий:</p>
                            <p className="text-xs sm:text-sm text-gray-900 italic leading-relaxed">
                              "{selectedOrder.review_comment}"
                            </p>
                          </div>
                        )}

                        {/* Средняя оценка */}
                        <div className="pt-2 border-t border-amber-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-semibold text-amber-900">Общая оценка:</span>
                            <div className="flex items-center gap-1.5">
                              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                              <span className="text-base font-bold text-amber-900">
                                {selectedOrder.delivery_type === 'доставка' && selectedOrder.rating_delivery
                                  ? ((selectedOrder.rating_product + selectedOrder.rating_delivery) / 2).toFixed(1)
                                  : selectedOrder.rating_product.toFixed(1)
                                }
                                /5
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Товары */}
                {((selectedOrder.items && selectedOrder.items.length > 0) || (selectedOrder.custom_bouquet && selectedOrder.custom_bouquet.length > 0)) && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">Товары в заказе</h4>
                    <div className="space-y-3">
                      {/* Обычные товары (исключаем custom, так как он показывается отдельно) */}
                      {selectedOrder.items && selectedOrder.items.filter(item => item.type !== 'custom').length > 0 && selectedOrder.items.filter(item => item.type !== 'custom').map((item, idx) => {
                        const composition = item.type === 'bouquet' && item.item_id 
                          ? getBouquetComposition(item.item_id) 
                          : [];
                        
                        return (
                          <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                            <div className="px-3 sm:px-4 py-3 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-gray-200">
                              <div className="flex justify-between items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm sm:text-base font-bold text-gray-900">{item.name}</p>
                                    <Badge className="text-[10px] bg-purple-100 text-purple-800">
                                      {item.type === 'bouquet' ? '🌹 Букет' : '🌸 Цветок'}
                                    </Badge>
                                  </div>
                                  <p className="text-xs sm:text-sm text-gray-600">Количество: {item.quantity} шт</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-sm sm:text-base font-bold text-pink-600">{item.quantity} × {item.price} ₽</p>
                                  <p className="text-xs sm:text-sm text-gray-500">{(item.quantity * item.price).toFixed(0)} ₽</p>
                                </div>
                              </div>
                            </div>
                            
                            {composition.length > 0 && (
                              <div className="px-3 sm:px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50">
                                <p className="text-xs font-semibold text-purple-900 mb-2 flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  Состав букета:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  {composition.map((flower, fIdx) => (
                                    <div key={fIdx} className="flex items-center justify-between text-xs text-purple-800 bg-white/60 rounded-lg px-2 py-1">
                                      <span className="font-medium">• {flower.flower_name}</span>
                                      <span className="text-purple-600 font-semibold">{flower.quantity} шт</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Кастомный букет */}
                      {selectedOrder.custom_bouquet && selectedOrder.custom_bouquet.length > 0 && (
                        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                          <div className="px-3 sm:px-4 py-3 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-gray-200">
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm sm:text-base font-bold text-gray-900">Собственный букет</p>
                                  <Badge className="text-[10px] bg-purple-100 text-purple-800">
                                    ✨ Собственный
                                  </Badge>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  Количество: {selectedOrder.custom_bouquet.reduce((sum, f) => sum + f.quantity, 0)} шт
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm sm:text-base font-bold text-pink-600">
                                  {selectedOrder.custom_bouquet.reduce((sum, f) => sum + (f.price * f.quantity), 0).toFixed(0)} ₽
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="px-3 sm:px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50">
                            <p className="text-xs font-semibold text-purple-900 mb-2 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5" />
                              Состав букета:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {selectedOrder.custom_bouquet.map((flower, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs text-purple-800 bg-white/60 rounded-lg px-2 py-1">
                                  <span className="font-medium">• {flower.flower_name}</span>
                                  <span className="text-purple-600 font-semibold">{flower.quantity} шт</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Текст открытки */}
                {selectedOrder.card_message && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">Текст открытки</h4>
                    <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border-l-4 border-pink-500">
                      <p className="text-xs sm:text-sm text-gray-700 italic leading-relaxed break-words">"{selectedOrder.card_message}"</p>
                    </div>
                  </div>
                )}

                {/* Управление статусом */}
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">Управление заказом</h4>
                  <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Изменить статус заказа</label>
                    <Select 
                      value={selectedOrder.status} 
                      onValueChange={(value) => handleStatusChange(selectedOrder.id, value)}
                    >
                      <SelectTrigger className="w-full bg-white h-9 sm:h-10 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableStatuses(selectedOrder.delivery_type).map((status) => (
                          <SelectItem key={status.value} value={status.value} className="text-xs sm:text-sm">
                            <div className="flex items-center gap-2">
                              <status.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${getStatusIconColor(status.value)}`} />
                              <span>{status.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Итого */}
                <div className="border-t pt-3 sm:pt-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Итоговая сумма заказа</p>
                      <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                        {selectedOrder.total_amount} ₽
                      </p>
                    </div>
                    <Button onClick={() => setSelectedOrder(null)} variant="outline" size="sm" className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm">
                      Закрыть
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getStatusColor(status) {
  const colors = {
    'новый': 'bg-blue-100 text-blue-800 border-blue-200',
    'в_обработке': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'собирается': 'bg-purple-100 text-purple-800 border-purple-200',
    'в_пути': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'доставлен': 'bg-green-100 text-green-800 border-green-200',
    'готов_к_выдаче': 'bg-teal-100 text-teal-800 border-teal-200',
    'выдан': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'отменен': 'bg-red-100 text-red-800 border-red-200'
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

function getStatusBgColor(status) {
  const colors = {
    'новый': 'bg-gradient-to-r from-blue-50 to-blue-100',
    'в_обработке': 'bg-gradient-to-r from-yellow-50 to-yellow-100',
    'собирается': 'bg-gradient-to-r from-purple-50 to-purple-100',
    'в_пути': 'bg-gradient-to-r from-indigo-50 to-indigo-100',
    'доставлен': 'bg-gradient-to-r from-green-50 to-green-100',
    'готов_к_выдаче': 'bg-gradient-to-r from-teal-50 to-teal-100',
    'выдан': 'bg-gradient-to-r from-emerald-50 to-emerald-100',
    'отменен': 'bg-gradient-to-r from-red-50 to-red-100'
  };
  return colors[status] || 'bg-gradient-to-r from-gray-50 to-gray-100';
}

function getStatusIconBg(status) {
  const colors = {
    'новый': 'bg-blue-200',
    'в_обработке': 'bg-yellow-200',
    'собирается': 'bg-purple-200',
    'в_пути': 'bg-indigo-200',
    'доставлен': 'bg-green-200',
    'готов_к_выдаче': 'bg-teal-200',
    'выдан': 'bg-emerald-200',
    'отменен': 'bg-red-200'
  };
  return colors[status] || 'bg-gray-200';
}

function getStatusIconComponent(status) {
  const icons = {
    'новый': <ShoppingBag className="w-5 h-5 text-blue-700" />,
    'в_обработке': <Clock className="w-5 h-5 text-yellow-700" />,
    'собирается': <Sparkles className="w-5 h-5 text-purple-700" />,
    'в_пути': <Truck className="w-5 h-5 text-indigo-700" />,
    'доставлен': <CheckCircle className="w-5 h-5 text-green-700" />,
    'готов_к_выдаче': <Package className="w-5 h-5 text-teal-700" />,
    'выдан': <CheckCircle className="w-5 h-5 text-emerald-700" />,
    'отменен': <XCircle className="w-5 h-5 text-red-700" />
  };
  return icons[status] || <Package className="w-5 h-5 text-gray-700" />;
}

function getStatusIconColor(status) {
  const colors = {
    'новый': 'text-blue-500',
    'в_обработке': 'text-yellow-500',
    'собирается': 'text-purple-500',
    'в_пути': 'text-indigo-500',
    'доставлен': 'text-green-500',
    'готов_к_выдаче': 'text-teal-500',
    'выдан': 'text-emerald-500',
    'отменен': 'text-red-500'
  };
  return colors[status] || 'text-gray-500';
}

function getStatusText(status) {
  const texts = {
    'новый': 'Новый',
    'в_обработке': 'В обработке',
    'собирается': 'Собирается',
    'в_пути': 'В пути',
    'доставлен': 'Доставлен',
    'готов_к_выдаче': 'Готов к выдаче',
    'выдан': 'Выдан',
    'отменен': 'Отменен'
  };
  return texts[status] || status;
}
