
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Package, Phone, MapPin, Calendar, User, Clock, Sparkles, Truck, CheckCircle, XCircle, ShoppingBag, Star, List, Store } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

export default function OrdersManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("все"); // Changed initial state from "новый" to "все"

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
    initialData: [],
  });

  const { data: bouquets, isLoading: loadingBouquets } = useQuery({
    queryKey: ['admin-bouquets'],
    queryFn: () => base44.entities.Bouquet.list(),
    initialData: [],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, previousStatus }) => {
      // Получаем свежие данные заказа из базы данных
      const allOrders = await base44.entities.Order.list();
      const order = allOrders.find(o => o.id === orderId);
      
      if (!order || !order.created_by) {
        throw new Error('Не удалось найти заказ или email получателя');
      }
      
      // Если меняем статус на "отменен", возвращаем товары на склад
      if (status === 'отменен' && previousStatus !== 'отменен') {
        // Возвращаем букеты и цветы
        if (order.items && order.items.length > 0) {
          const allBouquets = await base44.entities.Bouquet.list();
          const allFlowers = await base44.entities.Flower.list();

          for (const item of order.items) {
            if (item.type === 'bouquet' && item.item_id) {
              const bouquet = allBouquets.find(b => b.id === item.item_id);
              if (bouquet) {
                await base44.entities.Bouquet.update(bouquet.id, {
                  stock_quantity: (bouquet.stock_quantity || 0) + item.quantity
                });
              }
            } else if (item.type === 'flower' && item.item_id) {
              const flower = allFlowers.find(f => f.id === item.item_id);
              if (flower) {
                await base44.entities.Flower.update(flower.id, {
                  stock_quantity: (flower.stock_quantity || 0) + item.quantity
                });
              }
            }
          }
        }
        
        // Возвращаем цветы из кастомных букетов
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
      
      // Обновляем статус заказа
      await base44.entities.Order.update(orderId, { status });
      
      // Создаем уведомление для пользователя
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
      
      // Создаем уведомление в системе
      await base44.entities.Notification.create({
        user_email: order.created_by,
        order_id: orderId,
        title: statusInfo.title,
        message: `${statusInfo.message}. Заказ #${orderId.slice(0, 8)}`,
        type: 'order_status',
        order_status: status,
        is_read: false
      });
      
      // Отправляем email уведомление
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
                ${status === 'в_пути' ? `
                  <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #1e40af;">📞 Курьер скоро свяжется с вами для уточнения времени доставки. Пожалуйста, держите телефон под рукой.</p>
                  </div>
                ` : ''}
                ${(status === 'доставлен' || status === 'выдан') ? `
                  <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #065f46;">⭐ Оцените качество товара и доставки в приложении!</p>
                  </div>
                ` : ''}
                ${status === 'отменен' ? `
                  <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #991b1b;">❌ Заказ отменен. Если у вас есть вопросы, свяжитесь с нами.</p>
                  </div>
                ` : ''}
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bouquets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-flowers'] });
      toast({
        title: "Статус обновлен",
        description: `Уведомление отправлено на ${data.recipientEmail}`,
        duration: 2000,
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить статус",
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  const handleStatusChange = (orderId, newStatus) => {
    const order = orders.find(o => o.id === orderId);
    const previousStatus = order?.status;
    updateStatusMutation.mutate({ orderId, status: newStatus, previousStatus });
  };

  const getBouquetComposition = (bouquetId) => {
    const bouquet = bouquets.find(b => b.id === bouquetId);
    return bouquet?.composition || [];
  };

  // Сортировка заказов по приоритету статусов
  const statusPriority = {
    'новый': 1,
    'в_обработке': 2,
    'собирается': 3,
    'в_пути': 4,
    'готов_к_выдаче': 5,
    'доставлен': 6,  // Одинаковый приоритет с "выдан"
    'выдан': 6,      // Одинаковый приоритет с "доставлен"
    'отменен': 7
  };

  const sortedOrders = [...orders].sort((a, b) => {
    const priorityA = statusPriority[a.status] || 999;
    const priorityB = statusPriority[b.status] || 999;
    
    // Сортировка по приоритету статусов
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // Если приоритеты равны - сортируем по дате создания (новые сверху)
    return new Date(b.created_date) - new Date(a.created_date);
  });

  // Фильтрация заказов по статусу
  const filteredOrders = statusFilter === "все" 
    ? sortedOrders 
    : sortedOrders.filter(order => order.status === statusFilter);

  // Подсчет заказов по статусам
  const getOrderCountByStatus = (status) => {
    return orders.filter(order => order.status === status).length;
  };

  const statusFilters = [
    { value: "все", label: "Все", count: orders.length, color: "bg-gray-100 text-gray-800 hover:bg-gray-200" },
    { value: "новый", label: "Новые", count: getOrderCountByStatus("новый"), color: "bg-blue-100 text-blue-800 hover:bg-blue-200" },
    { value: "в_обработке", label: "В обработке", count: getOrderCountByStatus("в_обработке"), color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" },
    { value: "собирается", label: "Собирается", count: getOrderCountByStatus("собирается"), color: "bg-purple-100 text-purple-800 hover:bg-purple-200" },
    { value: "в_пути", label: "В пути", count: getOrderCountByStatus("в_пути"), color: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200" },
    { value: "доставлен", label: "Доставлен", count: getOrderCountByStatus("доставлен"), color: "bg-green-100 text-green-800 hover:bg-green-200" },
    { value: "готов_к_выдаче", label: "Готов", count: getOrderCountByStatus("готов_к_выдаче"), color: "bg-teal-100 text-teal-800 hover:bg-teal-200" },
    { value: "выдан", label: "Выдан", count: getOrderCountByStatus("выдан"), color: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" },
    { value: "отменен", label: "Отменен", count: getOrderCountByStatus("отменен"), color: "bg-red-100 text-red-800 hover:bg-red-200" },
  ];

  // Получить доступные статусы в зависимости от типа доставки
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

  const getQuickActions = (currentStatus, deliveryType) => {
    const deliveryFlow = {
      'новый': [
        { status: 'в_обработке', label: 'Обработать', icon: Clock },
        { status: 'отменен', label: 'Отменить', icon: XCircle }
      ],
      'в_обработке': [
        { status: 'собирается', label: 'Собрать', icon: Sparkles },
        { status: 'отменен', label: 'Отменить', icon: XCircle }
      ],
      'собирается': [
        { status: 'в_пути', label: 'Отправить', icon: Truck }
      ],
      'в_пути': [
        { status: 'доставлен', label: 'Доставлено', icon: CheckCircle }
      ],
      'доставлен': [],
      'отменен': []
    };

    const pickupFlow = {
      'новый': [
        { status: 'в_обработке', label: 'Обработать', icon: Clock },
        { status: 'отменен', label: 'Отменить', icon: XCircle }
      ],
      'в_обработке': [
        { status: 'собирается', label: 'Собрать', icon: Sparkles },
        { status: 'отменен', label: 'Отменить', icon: XCircle }
      ],
      'собирается': [
        { status: 'готов_к_выдаче', label: 'К выдаче', icon: Package }
      ],
      'готов_к_выдаче': [
        { status: 'выдан', label: 'Выдано', icon: CheckCircle }
      ],
      'выдан': [],
      'отменен': []
    };
    
    const flow = deliveryType === 'доставка' ? deliveryFlow : pickupFlow;
    return flow[currentStatus] || [];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Загрузка заказов...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Компактный фильтр */}
      <div className="bg-white rounded-2xl shadow-md p-4">
        <div className="flex items-center gap-2 mb-3">
          <List className="w-4 h-4 text-pink-600" />
          <h3 className="font-bold text-gray-900 text-sm">Фильтр</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => {
            const isActive = statusFilter === filter.value;
            
            return (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isActive 
                    ? 'ring-2 ring-pink-400 shadow-md' 
                    : 'hover:scale-105'
                } ${filter.color}`}
              >
                <span>{filter.label}</span>
                <Badge className="bg-white/80 text-gray-900 px-1.5 py-0 text-[10px] min-w-[20px] justify-center">
                  {filter.count}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      {/* Список заказов */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <Package className="w-16 h-16 text-pink-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {statusFilter === "все" 
                ? "Заказов пока нет" 
                : `Нет заказов со статусом "${statusFilters.find(f => f.value === statusFilter)?.label}"`
              }
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const availableStatuses = getAvailableStatuses(order.delivery_type);
            
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-bold text-gray-900">Заказ #{order.id.slice(0, 8)}</h3>
                        <Badge className={getStatusColor(order.status)}>
                          <span className="flex items-center gap-1.5">
                            {getStatusIcon(order.status)}
                            {getStatusText(order.status)}
                          </span>
                        </Badge>
                        <Badge className={order.delivery_type === "доставка" ? "bg-indigo-100 text-indigo-800" : "bg-purple-100 text-purple-800"}>
                          <span className="flex items-center gap-1.5">
                            {order.delivery_type === "доставка" ? <Truck className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                            {order.delivery_type}
                          </span>
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                        {order.total_amount} ₽
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-4 h-4 text-pink-500" />
                        <span className="text-sm">
                          Создан: {format(new Date(order.created_date), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                        </span>
                      </div>
                      {order.recipient_name && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <User className="w-4 h-4 text-pink-500" />
                          <span className="text-sm">{order.recipient_name}</span>
                        </div>
                      )}
                      {order.recipient_phone && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Phone className="w-4 h-4 text-pink-500" />
                          <span className="text-sm">{order.recipient_phone}</span>
                        </div>
                      )}
                      {order.delivery_address && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin className="w-4 h-4 text-pink-500" />
                          <span className="text-sm">{order.delivery_address}</span>
                        </div>
                      )}
                      {order.delivery_date && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-4 h-4 text-pink-500" />
                          <span className="text-sm">
                            {order.delivery_type === 'самовывоз' ? 'Самовывоз' : 'Доставка'}: {format(new Date(order.delivery_date), 'dd MMMM yyyy', { locale: ru })}
                            {order.delivery_time && `, ${order.delivery_time}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Оценки клиента */}
                    {order.rating_product && (
                      <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl">
                        <div className="flex items-center gap-2 mb-3">
                          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                          <p className="font-bold text-amber-900">Оценка клиента</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Качество товара:</span>
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < order.rating_product ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="ml-2 text-sm font-bold text-gray-900">{order.rating_product}/5</span>
                            </div>
                          </div>
                          {order.delivery_type === 'доставка' && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Качество доставки:</span>
                              <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < order.rating_delivery ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                <span className="ml-2 text-sm font-bold text-gray-900">{order.rating_delivery}/5</span>
                              </div>
                            </div>
                          )}
                          {order.review_comment && (
                            <div className="mt-3 pt-3 border-t border-amber-200">
                              <p className="text-sm font-medium text-gray-700 mb-1">Комментарий:</p>
                              <p className="text-sm text-gray-600 italic">"{order.review_comment}"</p>
                            </div>
                          )}
                          {order.review_date && (
                            <p className="text-xs text-gray-500 mt-2">
                              Оставлен: {format(new Date(order.review_date), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Товары в заказе */}
                    {((order.items && order.items.length > 0) || (order.custom_bouquet && order.custom_bouquet.length > 0)) && (
                      <div>
                        <p className="font-medium text-gray-900 mb-3 text-sm uppercase tracking-wider">Товары в заказе:</p>
                        <div className="space-y-3">
                          {/* Обычные товары (исключаем custom, так как он показывается отдельно) */}
                          {order.items && order.items.filter(item => item.type !== 'custom').length > 0 && order.items.filter(item => item.type !== 'custom').map((item, idx) => {
                            const composition = item.type === 'bouquet' && item.item_id 
                              ? getBouquetComposition(item.item_id) 
                              : [];
                            
                            return (
                              <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                <div className="px-3 sm:px-4 py-3 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-gray-200">
                                  <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                          {order.custom_bouquet && order.custom_bouquet.length > 0 && (
                            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                              <div className="px-3 sm:px-4 py-3 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-gray-200">
                                <div className="flex justify-between items-start gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <p className="text-sm sm:text-base font-bold text-gray-900">Собственный букет</p>
                                      <Badge className="text-[10px] bg-purple-100 text-purple-800">
                                        ✨ Собственный
                                      </Badge>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                      Количество: {order.custom_bouquet.reduce((sum, f) => sum + f.quantity, 0)} шт
                                    </p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="text-sm sm:text-base font-bold text-pink-600">
                                      {order.custom_bouquet.reduce((sum, f) => sum + (f.price * f.quantity), 0).toFixed(0)} ₽
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
                                  {order.custom_bouquet.map((flower, idx) => (
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

                    {order.card_message && (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4">
                        <p className="font-medium text-gray-900 mb-1">Текст открытки:</p>
                        <p className="text-sm text-gray-700 italic">{order.card_message}</p>
                      </div>
                    )}
                  </div>

                  <div className="lg:w-64 space-y-3">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Изменить статус</label>
                    <Select value={order.status} onValueChange={(value) => handleStatusChange(order.id, value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              <status.icon className={`w-4 h-4 ${getStatusIconColor(status.value)}`} />
                              <span>{status.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Быстрые действия */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-3">
                      <p className="text-xs font-medium text-gray-600 mb-2">Быстрые действия</p>
                      <div className="grid grid-cols-2 gap-2">
                        {getQuickActions(order.status, order.delivery_type).map((action) => (
                          <Button
                            key={action.status}
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(order.id, action.status)}
                            className="text-xs"
                          >
                            <action.icon className="w-3 h-3 mr-1" />
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
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

function getStatusIcon(status) {
  const icons = {
    'новый': <ShoppingBag className="w-3.5 h-3.5" />,
    'в_обработке': <Clock className="w-3.5 h-3.5" />,
    'собирается': <Sparkles className="w-3.5 h-3.5" />,
    'в_пути': <Truck className="w-3.5 h-3.5" />,
    'доставлен': <CheckCircle className="w-3.5 h-3.5" />,
    'готов_к_выдаче': <Package className="w-3.5 h-3.5" />,
    'выдан': <CheckCircle className="w-3.5 h-3.5" />,
    'отменен': <XCircle className="w-3.5 h-3.5" />
  };
  return icons[status] || <Package className="w-3.5 h-3.5" />;
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
