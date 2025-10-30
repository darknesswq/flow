import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Package, Trash2, Minus, Plus, ShoppingCart, Truck, Store, Check, Calendar as CalendarIcon, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { format, addDays } from "date-fns";
import { ru } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";

/**
 * СТРАНИЦА КОРЗИНЫ И ОФОРМЛЕНИЯ ЗАКАЗА
 * Позволяет:
 * - Просмотреть товары в корзине
 * - Изменить количество или удалить товары
 * - Оформить заказ с указанием деталей доставки
 * - Выбрать доставку или самовывоз
 */
export default function Cart() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // ===== СОСТОЯНИЕ КОМПОНЕНТА =====
  
  // Корзина: массив товаров
  const [cart, setCart] = useState([]);
  
  // Флаг отображения формы оформления заказа
  const [showCheckout, setShowCheckout] = useState(false);
  
  // Выбранная дата доставки/самовывоза
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Данные формы оформления заказа
  const [orderData, setOrderData] = useState({
    delivery_type: "доставка",      // Тип: доставка или самовывоз
    delivery_address: "",             // Адрес доставки
    delivery_date: "",                // Дата доставки
    delivery_time: "",                // Время доставки
    recipient_name: "",               // Имя получателя
    recipient_phone: "",              // Телефон получателя
    sender_name: "",                  // Имя отправителя
    card_message: ""                  // Текст открытки
  });

  // ===== ЗАГРУЗКА КОРЗИНЫ ИЗ LOCALSTORAGE =====
  
  /**
   * При монтировании компонента загружаем корзину из localStorage
   */
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // ===== ФУНКЦИИ РАБОТЫ С КОРЗИНОЙ =====
  
  /**
   * Сохраняет корзину в состоянии и localStorage
   */
  const saveCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  /**
   * Изменяет количество товара в корзине
   * Если количество становится 0 - удаляет товар
   */
  const updateQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(index);
    } else {
      const newCart = [...cart];
      newCart[index].quantity = newQuantity;
      saveCart(newCart);
    }
  };

  /**
   * Удаляет товар из корзины по индексу
   */
  const removeItem = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    saveCart(newCart);
  };

  /**
   * Вычисляет общую стоимость всех товаров в корзине
   */
  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // ===== СОЗДАНИЕ ЗАКАЗА =====
  
  /**
   * Мутация для создания заказа
   * 
   * АЛГОРИТМ:
   * 1. Загружает все букеты и цветы из базы
   * 2. Проверяет остатки ПЕРЕД созданием заказа
   * 3. Если остатков достаточно - создает заказ
   * 4. Вычитает товары со склада
   * 5. Создает уведомление для клиента
   * 6. Отправляет email-подтверждение
   */
  const createOrderMutation = useMutation({
    mutationFn: async (data) => {
      // ШАГ 1: Загружаем все данные один раз (для проверки остатков)
      const allBouquets = await base44.entities.Bouquet.list();
      const allFlowers = await base44.entities.Flower.list();
      
      // ШАГ 2: Проверяем наличие товаров ДО создания заказа
      // Это важно, чтобы не создавать заказ с недостаточными остатками
      for (const item of data.items) {
        if (item.type === 'bouquet' && item.item_id) {
          const bouquet = allBouquets.find(b => b.id === item.item_id);
          if (!bouquet || (bouquet.stock_quantity || 0) < item.quantity) {
            throw new Error(`Недостаточно товара: "${item.name}". В наличии: ${bouquet?.stock_quantity || 0}.`);
          }
        } else if (item.type === 'flower' && item.item_id) {
          const flower = allFlowers.find(f => f.id === item.item_id);
          if (!flower || (flower.stock_quantity || 0) < item.quantity) {
            throw new Error(`Недостаточно товара: "${item.name}". В наличии: ${flower?.stock_quantity || 0}.`);
          }
        }
      }
      
      // ШАГ 3: Проверяем наличие цветов для кастомных букетов
      if (data.custom_bouquet && data.custom_bouquet.length > 0) {
        for (const flower of data.custom_bouquet) {
          const flowerEntity = allFlowers.find(f => f.id === flower.flower_id);
          if (!flowerEntity || (flowerEntity.stock_quantity || 0) < flower.quantity) {
            throw new Error(`Недостаточно цветов для букета: "${flower.flower_name}". В наличии: ${flowerEntity?.stock_quantity || 0}.`);
          }
        }
      }
      
      // ШАГ 4: Создаем заказ (все проверки пройдены)
      const order = await base44.entities.Order.create(data);
      
      // ШАГ 5: Вычитаем остатки после успешного создания заказа
      for (const item of data.items) {
        if (item.type === 'bouquet' && item.item_id) {
          const bouquet = allBouquets.find(b => b.id === item.item_id);
          if (bouquet) {
            await base44.entities.Bouquet.update(bouquet.id, {
              stock_quantity: (bouquet.stock_quantity || 0) - item.quantity
            });
          }
        } else if (item.type === 'flower' && item.item_id) {
          const flower = allFlowers.find(f => f.id === item.item_id);
          if (flower) {
            await base44.entities.Flower.update(flower.id, {
              stock_quantity: (flower.stock_quantity || 0) - item.quantity
            });
          }
        }
      }
      
      // ШАГ 6: Вычитаем цветы для кастомных букетов
      if (data.custom_bouquet && data.custom_bouquet.length > 0) {
        for (const flower of data.custom_bouquet) {
          const flowerEntity = allFlowers.find(f => f.id === flower.flower_id);
          if (flowerEntity) {
            await base44.entities.Flower.update(flowerEntity.id, {
              stock_quantity: (flowerEntity.stock_quantity || 0) - flower.quantity
            });
          }
        }
      }
      
      // ШАГ 7: Создаем уведомление о создании заказа
      const user = await base44.auth.me();
      await base44.entities.Notification.create({
        user_email: user.email,
        order_id: order.id,
        title: 'Заказ создан',
        message: `Ваш заказ #${order.id.slice(0, 8)} успешно создан на сумму ${order.total_amount} ₽`,
        type: 'order_created',
        order_status: 'новый',
        is_read: false
      });
      
      // ШАГ 8: Отправляем email подтверждение
      try {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: 'FlowerDream: Заказ создан',
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(to right, #ec4899, #a855f7); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">FlowerDream</h1>
                <p style="color: white; margin: 10px 0 0 0;">Цветы с любовью</p>
              </div>
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">✅ Заказ успешно создан!</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  Спасибо за ваш заказ! Мы уже начали его обработку.
                </p>
                <div style="background: #fce7f3; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #831843;"><strong>Номер заказа:</strong> #${order.id.slice(0, 8)}</p>
                  <p style="margin: 10px 0 0 0; color: #831843;"><strong>Сумма:</strong> ${order.total_amount} ₽</p>
                  <p style="margin: 10px 0 0 0; color: #831843;"><strong>Тип:</strong> ${order.delivery_type}</p>
                </div>
                <p style="color: #4b5563; font-size: 14px;">
                  Мы отправим вам уведомления о каждом изменении статуса заказа.
                </p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                  С уважением,<br>
                  Команда FlowerDream
                </p>
              </div>
            </div>
          `
        });
      } catch (emailError) {
        // Если email не отправился - не критично, заказ уже создан
        console.error('Failed to send email:', emailError);
      }
      
      return order;
    },
    // При успешном создании заказа
    onSuccess: () => {
      // Инвалидируем все связанные кэши для обновления данных
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bouquets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-flowers'] });
      queryClient.invalidateQueries({ queryKey: ['bouquets'] });
      queryClient.invalidateQueries({ queryKey: ['flowers'] });
      
      // Очищаем корзину
      localStorage.removeItem("cart");
      setCart([]);
      
      // Переходим на страницу заказов
      navigate(createPageUrl("Orders"));
    },
    // При ошибке создания заказа
    onError: (error) => {
      toast({
        title: "Ошибка создания заказа",
        description: error.message || "Не удалось создать заказ. Попробуйте еще раз.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  /**
   * Обработчик отправки формы оформления заказа
   * Формирует данные и запускает мутацию создания заказа
   */
  const handleCheckout = async (e) => {
    e.preventDefault();
    
    // Формируем массив товаров для заказа
    const orderItems = cart.map(item => ({
      type: item.type,
      item_id: item.id || null,
      name: item.name,
      quantity: item.quantity,
      price: item.price
    }));

    // Извлекаем состав кастомных букетов
    const customBouquet = cart
      .filter(item => item.type === "custom")
      .flatMap(item => item.flowers || [])
      .map(flower => ({
          flower_id: flower.flower_id,
          flower_name: flower.flower_name,
          quantity: flower.quantity,
          price: flower.price
      }));

    // Создаем заказ
    await createOrderMutation.mutateAsync({
      items: orderItems,
      custom_bouquet: customBouquet.length > 0 ? customBouquet : null,
      total_amount: getTotalPrice(),
      payment_status: "оплачен", // По умолчанию наличные при получении
      payment_method: "наличные",
      ...orderData
    });
  };

  /**
   * Обработчик выбора даты в календаре
   * Обновляет состояние и форматирует дату для отправки
   */
  const handleDateSelect = (date) => {
    if (date) {
      setSelectedDate(date);
      setOrderData({...orderData, delivery_date: format(date, "yyyy-MM-dd")});
    }
  };

  // ===== ВСПОМОГАТЕЛЬНЫЕ ДАННЫЕ =====
  
  // Быстрый выбор дат (сегодня, завтра и еще 2 дня)
  const quickDates = [
    { label: "Сегодня", value: format(new Date(), "yyyy-MM-dd"), date: new Date() },
    { label: "Завтра", value: format(addDays(new Date(), 1), "yyyy-MM-dd"), date: addDays(new Date(), 1) },
    { label: format(addDays(new Date(), 2), "d MMM", { locale: ru }), value: format(addDays(new Date(), 2), "yyyy-MM-dd"), date: addDays(new Date(), 2) },
    { label: format(addDays(new Date(), 3), "d MMM", { locale: ru }), value: format(addDays(new Date(), 3), "yyyy-MM-dd"), date: addDays(new Date(), 3) },
  ];

  // Временные слоты для выбора времени доставки
  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00",
    "17:00", "18:00", "19:00", "20:00"
  ];

  // ===== РЕНДЕР КОМПОНЕНТА =====
  
  // Пустая корзина
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Заголовок страницы */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Home"))}
              className="rounded-full"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Корзина
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">Оформите ваш заказ</p>
            </div>
          </div>

          {/* Пустое состояние */}
          <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8 text-center">
            <Package className="w-12 md:w-16 h-12 md:h-16 text-pink-300 mx-auto mb-4" />
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Корзина пуста</h2>
            <p className="text-sm md:text-base text-gray-600 mb-6">Добавьте букеты или создайте свой собственный</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate(createPageUrl("Home"))}
                variant="outline"
                className="rounded-full px-6"
              >
                К каталогу
              </Button>
              <Button
                onClick={() => navigate(createPageUrl("BouquetBuilder"))}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full px-6"
              >
                Создать букет
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Корзина с товарами
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Заголовок страницы */}
        <div className="flex items-center gap-4 mb-6 md:mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Home"))}
            className="rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Корзина
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">{cart.length} {cart.length === 1 ? 'товар' : 'товаров'}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* ЛЕВАЯ КОЛОНКА: Список товаров в корзине */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {cart.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="bg-white rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6"
                >
                  <div className="flex gap-3 md:gap-4">
                    {/* Изображение товара */}
                    <div className="w-20 md:w-24 h-20 md:h-24 rounded-xl md:rounded-2xl overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 flex-shrink-0">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="w-8 md:w-10 h-8 md:h-10 text-pink-300" />
                        </div>
                      )}
                    </div>

                    {/* Информация о товаре */}
                    <div className="flex-1 min-w-0">
                      {/* Название и кнопка удаления */}
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base md:text-lg text-gray-900 truncate">{item.name}</h3>
                          {item.type === "custom" && (
                            <p className="text-xs md:text-sm text-gray-500">Собственный букет</p>
                          )}
                          {item.description && (
                            <p className="text-xs md:text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="w-4 md:w-5 h-4 md:h-5" />
                        </Button>
                      </div>

                      {/* Состав кастомного букета */}
                      {item.type === "custom" && item.flowers && (
                        <div className="mt-3 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
                          <p className="text-sm font-medium text-gray-700 mb-2">Состав:</p>
                          <div className="space-y-1">
                            {item.flowers.map((flower, idx) => (
                              <p key={idx} className="text-sm text-gray-600">
                                • {flower.flower_name} - {flower.quantity} шт
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Количество и цена */}
                      <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
                        {/* Счетчик количества */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="w-8 h-8 rounded-full"
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                            className="w-14 md:w-16 text-center"
                            min="1"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="w-8 h-8 rounded-full"
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        {/* Цена */}
                        <div className="text-right">
                          <p className="text-xs md:text-sm text-gray-500">{item.price} ₽ × {item.quantity}</p>
                          <p className="text-lg md:text-xl font-bold text-pink-600">
                            {(item.price * item.quantity).toFixed(0)} ₽
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* ПРАВАЯ КОЛОНКА: Итого и форма оформления */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {!showCheckout ? (
                /* БЛОК ИТОГО (до нажатия "Оформить заказ") */
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl shadow-xl p-6"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Итого</h2>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-600">
                      <span>Товары ({cart.length})</span>
                      <span>{getTotalPrice().toFixed(0)} ₽</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-xl font-bold">
                      <span>Всего</span>
                      <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                        {getTotalPrice().toFixed(0)} ₽
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => setShowCheckout(true)}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-lg py-6 rounded-2xl shadow-lg"
                  >
                    Оформить заказ
                  </Button>
                </motion.div>
              ) : (
                /* ФОРМА ОФОРМЛЕНИЯ ЗАКАЗА */
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl shadow-xl p-6 max-h-[calc(100vh-120px)] overflow-y-auto"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Оформление заказа</h2>
                  
                  <form onSubmit={handleCheckout} className="space-y-6">
                    {/* Выбор типа получения: доставка или самовывоз */}
                    <div>
                      <Label className="text-gray-700 font-medium mb-3 block">Тип получения</Label>
                      <RadioGroup 
                        value={orderData.delivery_type} 
                        onValueChange={(value) => setOrderData({...orderData, delivery_type: value})}
                        className="grid grid-cols-2 gap-3"
                      >
                        {/* Кнопка "Доставка" */}
                        <div className={`relative flex items-center justify-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${orderData.delivery_type === 'доставка' ? 'border-pink-500 bg-gradient-to-r from-pink-50 to-purple-50' : 'border-gray-200 hover:border-pink-300'}`}>
                          <RadioGroupItem value="доставка" id="delivery" className="sr-only" />
                          <Label htmlFor="delivery" className="flex flex-col items-center gap-2 cursor-pointer">
                            <Truck className="w-6 h-6 text-pink-500" />
                            <span className="font-medium">Доставка</span>
                          </Label>
                        </div>
                        
                        {/* Кнопка "Самовывоз" */}
                        <div className={`relative flex items-center justify-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${orderData.delivery_type === 'самовывоз' ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50' : 'border-gray-200 hover:border-purple-300'}`}>
                          <RadioGroupItem value="самовывоз" id="pickup" className="sr-only" />
                          <Label htmlFor="pickup" className="flex flex-col items-center gap-2 cursor-pointer">
                            <Store className="w-6 h-6 text-purple-500" />
                            <span className="font-medium">Самовывоз</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Адрес доставки (только для доставки) */}
                    {orderData.delivery_type === "доставка" && (
                      <div>
                        <Label htmlFor="address" className="text-gray-700 font-medium mb-2 block">Адрес доставки *</Label>
                        <Input
                          id="address"
                          value={orderData.delivery_address}
                          onChange={(e) => setOrderData({...orderData, delivery_address: e.target.value})}
                          placeholder="Улица, дом, квартира"
                          required
                          className="rounded-xl"
                        />
                      </div>
                    )}

                    {/* Выбор даты доставки/самовывоза */}
                    <div>
                      <Label className="text-gray-700 font-medium mb-3 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-pink-500" />
                        Дата доставки
                      </Label>
                      
                      {/* Быстрый выбор даты (сегодня, завтра и т.д.) */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {quickDates.map((date) => (
                          <button
                            key={date.value}
                            type="button"
                            onClick={() => {
                              setSelectedDate(date.date);
                              setOrderData({...orderData, delivery_date: date.value});
                            }}
                            className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                              orderData.delivery_date === date.value
                                ? 'border-pink-500 bg-gradient-to-r from-pink-50 to-purple-50 text-pink-700'
                                : 'border-gray-200 hover:border-pink-300 text-gray-700'
                            }`}
                          >
                            {date.label}
                          </button>
                        ))}
                      </div>

                      {/* Календарь для выбора другой даты */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start text-left font-normal rounded-xl border-2 hover:border-pink-300"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-pink-500" />
                            {selectedDate ? (
                              format(selectedDate, 'PPP', { locale: ru })
                            ) : (
                              <span className="text-gray-500">Выбрать другую дату</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-2 border-pink-200" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                            locale={ru}
                            className="rounded-2xl"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Выбор времени доставки */}
                    <div>
                      <Label className="text-gray-700 font-medium mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-500" />
                        Время доставки
                      </Label>
                      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2">
                        {timeSlots.map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setOrderData({...orderData, delivery_time: time})}
                            className={`p-2 rounded-lg border-2 transition-all text-sm font-medium ${
                              orderData.delivery_time === time
                                ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700'
                                : 'border-gray-200 hover:border-purple-300 text-gray-700'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Информация о получателе */}
                    <div>
                      <Label htmlFor="recipient" className="text-gray-700 font-medium mb-2 block">Имя получателя</Label>
                      <Input
                        id="recipient"
                        value={orderData.recipient_name}
                        onChange={(e) => setOrderData({...orderData, recipient_name: e.target.value})}
                        placeholder="Иван Иванов"
                        className="rounded-xl"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-gray-700 font-medium mb-2 block">Телефон получателя *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={orderData.recipient_phone}
                        onChange={(e) => setOrderData({...orderData, recipient_phone: e.target.value})}
                        placeholder="+7 (999) 123-45-67"
                        required
                        className="rounded-xl"
                      />
                    </div>

                    <div>
                      <Label htmlFor="sender" className="text-gray-700 font-medium mb-2 block">Имя отправителя</Label>
                      <Input
                        id="sender"
                        value={orderData.sender_name}
                        onChange={(e) => setOrderData({...orderData, sender_name: e.target.value})}
                        placeholder="От кого букет"
                        className="rounded-xl"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message" className="text-gray-700 font-medium mb-2 block">Текст открытки</Label>
                      <Textarea
                        id="message"
                        value={orderData.card_message}
                        onChange={(e) => setOrderData({...orderData, card_message: e.target.value})}
                        placeholder="Ваше поздравление..."
                        rows={3}
                        className="rounded-xl resize-none"
                      />
                    </div>

                    <Separator />

                    {/* Информация об оплате */}
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                      <p className="text-sm font-medium text-green-900 mb-1">💰 Оплата наличными при получении</p>
                      <p className="text-xs text-green-700">Вы сможете оплатить заказ наличными курьеру или при самовывозе</p>
                    </div>

                    {/* Итоговая сумма */}
                    <div className="flex justify-between text-xl font-bold py-2">
                      <span>К оплате</span>
                      <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                        {getTotalPrice().toFixed(0)} ₽
                      </span>
                    </div>

                    {/* Кнопки "Назад" и "Подтвердить заказ" */}
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCheckout(false)}
                        className="flex-1 rounded-xl"
                      >
                        Назад
                      </Button>
                      <Button
                        type="submit"
                        disabled={createOrderMutation.isPending}
                        className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl"
                      >
                        {createOrderMutation.isPending ? (
                          "Оформление..."
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Подтвердить заказ
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}