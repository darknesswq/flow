
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Sparkles, Heart, Gift, Star, ShoppingCart, X, Plus, Minus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

import HeroSection from "../components/home/HeroSection";
import PopularBouquets from "../components/home/PopularBouquets";
import FlowersCatalog from "../components/home/FlowersCatalog";
import OccasionSection from "../components/home/OccasionSection";

/**
 * ГЛАВНАЯ СТРАНИЦА ПРИЛОЖЕНИЯ
 * Отображает каталог букетов и отдельных цветов
 * Позволяет фильтровать по поводу (романтика, день рождения и т.д.)
 * Управляет корзиной покупок
 */
export default function Home() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // ===== СОСТОЯНИЕ КОМПОНЕНТА =====
  
  // Активная вкладка: "bouquets" (букеты) или "flowers" (отдельные цветы)
  const [activeTab, setActiveTab] = useState("bouquets");
  
  // Фильтр по случаю (романтика, день_рождения и т.д.) или null (все букеты)
  const [occasionFilter, setOccasionFilter] = useState(null);
  
  // Корзина: массив товаров с их количеством
  const [cart, setCart] = useState([]);

  // ===== ЗАГРУЗКА ДАННЫХ ИЗ API =====
  
  // Загружаем все букеты из базы данных (сортировка по дате создания)
  const { data: bouquets, isLoading: loadingBouquets } = useQuery({
    queryKey: ['bouquets'],
    queryFn: () => base44.entities.Bouquet.list('-created_date'),
    initialData: [],
  });

  // Загружаем все цветы из базы данных (сортировка по дате создания)
  const { data: flowers, isLoading: loadingFlowers } = useQuery({
    queryKey: ['flowers'],
    queryFn: () => base44.entities.Flower.list('-created_date'),
    initialData: [],
  });

  // ===== СИНХРОНИЗАЦИЯ КОРЗИНЫ С LOCALSTORAGE =====
  
  /**
   * Загружаем корзину из localStorage при монтировании компонента
   * И подписываемся на изменения (когда корзина меняется в других вкладках)
   * Также опрашиваем каждые 500мс для синхронизации состояния
   */
  useEffect(() => {
    const loadCart = () => {
      const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCart(savedCart);
    };
    
    // Загружаем корзину при первом рендере
    loadCart();
    
    // Подписываемся на событие storage (изменения в других вкладках)
    window.addEventListener("storage", loadCart);
    
    // Опрашиваем каждые 500мс для синхронизации
    const interval = setInterval(loadCart, 500);
    
    // Очищаем подписки при размонтировании
    return () => {
      window.removeEventListener("storage", loadCart);
      clearInterval(interval);
    };
  }, []);

  // ===== ФИЛЬТРАЦИЯ ДАННЫХ =====
  
  // Популярные букеты (с флагом is_popular=true)
  const popularBouquets = bouquets.filter(b => b.is_popular);
  
  // Букеты с учетом фильтра по случаю
  const filteredBouquets = occasionFilter 
    ? bouquets.filter(b => b.occasion === occasionFilter)
    : bouquets;

  // ===== РАБОТА С КОРЗИНОЙ =====
  
  /**
   * Обновляет корзину в состоянии и localStorage
   * Также генерирует событие storage для синхронизации между компонентами
   */
  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event('storage'));
  };

  /**
   * Получает количество товара в корзине по ID и типу
   * @param {string} itemId - ID товара
   * @param {string} type - Тип товара ("bouquet" или "flower")
   * @returns {number} Количество товара в корзине
   */
  const getItemQuantity = (itemId, type) => {
    const item = cart.find(i => i.id === itemId && i.type === type);
    return item ? item.quantity : 0;
  };

  /**
   * Добавляет товар в корзину с проверкой остатков
   * @param {Object} item - Товар для добавления
   * @param {string} type - Тип товара ("bouquet" или "flower")
   */
  const addToCart = (item, type = "bouquet") => {
    // Проверяем доступное количество на складе
    const stockQty = item.stock_quantity || 0;
    const currentQty = getItemQuantity(item.id, type);
    
    // Если товара нет на складе - показываем уведомление
    if (stockQty === 0) {
      toast({
        title: "Нет в наличии",
        description: `${item.name} закончился на складе`,
        duration: 2000,
      });
      return;
    }
    
    // Если уже добавлено максимальное количество - показываем уведомление
    if (currentQty >= stockQty) {
      toast({
        title: "Недостаточно товара",
        description: `Доступно только ${stockQty} шт`,
        duration: 2000,
      });
      return;
    }
    
    // Добавляем товар в корзину
    const newCart = [...cart];
    const existingIndex = newCart.findIndex(i => i.id === item.id && i.type === type);
    
    if (existingIndex >= 0) {
      // Если товар уже есть в корзине - увеличиваем количество
      newCart[existingIndex].quantity += 1;
    } else {
      // Если товара нет в корзине - добавляем новый элемент
      newCart.push({
        ...item,
        type: type,
        quantity: 1
      });
    }
    
    updateCart(newCart);
  };

  /**
   * Изменяет количество товара в корзине
   * @param {string} itemId - ID товара
   * @param {string} type - Тип товара
   * @param {number} delta - Изменение количества (+1 или -1)
   */
  const updateQuantity = (itemId, type, delta) => {
    const newCart = [...cart];
    const existingIndex = newCart.findIndex(i => i.id === itemId && i.type === type);
    
    if (existingIndex >= 0) {
      const newQuantity = newCart[existingIndex].quantity + delta;
      
      // Находим товар для проверки остатков
      const item = type === "bouquet" 
        ? bouquets.find(b => b.id === itemId)
        : flowers.find(f => f.id === itemId);
      
      const stockQty = item?.stock_quantity || 0;
      
      // Проверяем, не превышает ли новое количество остатки
      if (delta > 0 && newQuantity > stockQty) {
        toast({
          title: "Недостаточно товара",
          description: `Доступно только ${stockQty} шт`,
          duration: 2000,
        });
        return;
      }
      
      // Обновляем количество
      newCart[existingIndex].quantity = newQuantity;
      
      // Если количество стало 0 или меньше - удаляем товар
      if (newCart[existingIndex].quantity <= 0) {
        newCart.splice(existingIndex, 1);
      }
      
      updateCart(newCart);
    }
  };

  // ===== ФИЛЬТРАЦИЯ ПО СЛУЧАЮ =====
  
  /**
   * Обрабатывает выбор случая (повода)
   * Переключает на вкладку букетов и скроллит к каталогу
   */
  const handleOccasionSelect = (occasion) => {
    setOccasionFilter(occasion);
    setActiveTab("bouquets");
    
    // Небольшая задержка для переключения вкладки перед скроллом
    setTimeout(() => {
      document.getElementById("catalog-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  /**
   * Сбрасывает фильтр по случаю (показать все букеты)
   */
  const clearOccasionFilter = () => {
    setOccasionFilter(null);
  };

  /**
   * Возвращает читаемое название случая по его значению
   */
  const getOccasionName = (value) => {
    const names = {
      "романтика": "Романтика",
      "день_рождения": "День рождения",
      "благодарность": "Благодарность",
      "просто_так": "Просто так",
      "свадьба": "Свадьба"
    };
    return names[value] || value;
  };

  // ===== РЕНДЕР КОМПОНЕНТА =====

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Героическая секция с заголовком и CTA */}
      <HeroSection />

      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Секция выбора букетов по случаю */}
        <OccasionSection onOccasionSelect={handleOccasionSelect} />

        {/* Показываем популярные букеты только если нет фильтра по случаю */}
        {popularBouquets.length > 0 && !occasionFilter && (
          <PopularBouquets 
            bouquets={popularBouquets} 
            isLoading={loadingBouquets} 
            onAddToCart={addToCart}
            onUpdateQuantity={updateQuantity}
            getItemQuantity={getItemQuantity}
          />
        )}

        {/* Основной каталог с табами (букеты/цветы) */}
        <div id="catalog-section" className="mt-12 md:mt-16 scroll-mt-8">
          <div className="flex flex-col gap-4 mb-6 md:mb-8">
            {/* Заголовок каталога с динамическим текстом */}
            <div className="w-full">
              <h2 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {occasionFilter ? `Букеты: ${getOccasionName(occasionFilter)}` : 'Наш каталог'}
              </h2>
              <p className="text-sm md:text-base text-gray-600">
                {occasionFilter 
                  ? `Найдено ${filteredBouquets.length} ${filteredBouquets.length === 1 ? 'букет' : 'букетов'}`
                  : 'Выберите готовый букет или создайте свой собственный'
                }
              </p>
            </div>
            
            {/* Кнопка сброса фильтра и табы переключения */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
              {occasionFilter && (
                <Button
                  variant="outline"
                  onClick={clearOccasionFilter}
                  className="w-full sm:w-auto rounded-full border-pink-300 hover:bg-pink-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Сбросить фильтр
                </Button>
              )}
              
              {/* Табы переключения между букетами и цветами */}
              <div className="w-full sm:flex-1">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-white border border-pink-200 w-full grid grid-cols-2">
                    <TabsTrigger value="bouquets" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white text-sm">
                      Готовые букеты
                    </TabsTrigger>
                    <TabsTrigger value="flowers" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white text-sm">
                      Отдельные цветы
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>

          {/* Отображение букетов или цветов в зависимости от активной вкладки */}
          {activeTab === "bouquets" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {loadingBouquets ? (
                // Скелетоны загрузки (6 штук)
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="h-96 bg-white rounded-3xl animate-pulse" />
                ))
              ) : filteredBouquets.length > 0 ? (
                // Список букетов
                filteredBouquets.map((bouquet) => (
                  <BouquetCard 
                    key={bouquet.id} 
                    bouquet={bouquet} 
                    onAddToCart={() => addToCart(bouquet, "bouquet")}
                    onUpdateQuantity={updateQuantity}
                    quantity={getItemQuantity(bouquet.id, "bouquet")}
                  />
                ))
              ) : (
                // Пустое состояние
                <div className="col-span-full text-center py-12 bg-white rounded-3xl">
                  <Sparkles className="w-16 h-16 text-pink-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-4 px-4">
                    {occasionFilter 
                      ? `К сожалению, букетов для случая "${getOccasionName(occasionFilter)}" пока нет`
                      : 'Пока нет букетов в каталоге'
                    }
                  </p>
                  {occasionFilter && (
                    <Button
                      onClick={clearOccasionFilter}
                      variant="outline"
                      className="rounded-full"
                    >
                      Посмотреть все букеты
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Каталог отдельных цветов
            <FlowersCatalog 
              flowers={flowers} 
              isLoading={loadingFlowers}
              onAddToCart={addToCart}
              onUpdateQuantity={updateQuantity}
              getItemQuantity={getItemQuantity}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * КАРТОЧКА БУКЕТА
 * Отображает информацию о букете: изображение, название, состав, цену
 * Позволяет добавить в корзину или изменить количество
 */
function BouquetCard({ bouquet, onAddToCart, onUpdateQuantity, quantity }) {
  // Проверка остатков на складе
  const stockQty = bouquet.stock_quantity || 0;
  const isOutOfStock = stockQty === 0; // Товар закончился
  const isLowStock = stockQty < 5 && stockQty > 0; // Мало товара
  const canAddMore = quantity < stockQty; // Можно добавить еще
  
  return (
    <div className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 w-full">
      {/* Изображение букета - квадратное 1:1 */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100">
        {bouquet.image_url ? (
          <img 
            src={bouquet.image_url} 
            alt={bouquet.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Sparkles className="w-12 md:w-16 h-12 md:h-16 text-pink-300" />
          </div>
        )}
        
        {/* Оверлей "Нет в наличии" */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center">
            <span className="text-white font-bold text-sm md:text-base px-4 text-center">Нет в наличии</span>
          </div>
        )}
        
        {/* Бейдж "Мало товара" */}
        {!isOutOfStock && isLowStock && (
          <div className="absolute top-2 md:top-3 left-2 md:left-3 bg-amber-500 text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-sm font-medium shadow-lg">
            <span className="hidden sm:inline">Осталось {stockQty} шт</span>
            <span className="sm:hidden">{stockQty} шт</span>
          </div>
        )}
        
        {/* Бейдж "Популярный" */}
        {bouquet.is_popular && !isOutOfStock && (
          <div className="absolute top-2 md:top-3 right-2 md:right-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white p-1.5 md:p-2 rounded-full shadow-lg">
            <Star className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" />
          </div>
        )}
      </div>
      
      {/* Информация о букете */}
      <div className="p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 line-clamp-1">{bouquet.name}</h3>
        
        {/* Размер букета */}
        {bouquet.size && (
          <p className="text-xs text-gray-500 mb-2">
            Размер: <span className="font-medium text-gray-700">{bouquet.size} см</span>
          </p>
        )}

        {/* Состав букета */}
        {bouquet.composition && bouquet.composition.length > 0 && (
          <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
            <p className="text-xs font-bold text-purple-900 mb-1">Состав:</p>
            <div className="space-y-0.5">
              {/* Показываем первые 3 цветка */}
              {bouquet.composition.slice(0, 3).map((flower, idx) => (
                <p key={idx} className="text-xs text-purple-700">
                  • {flower.flower_name} - {flower.quantity} шт
                </p>
              ))}
              {/* Если цветков больше 3 - показываем "и ещё..." */}
              {bouquet.composition.length > 3 && (
                <p className="text-xs text-purple-600 italic">
                  и ещё {bouquet.composition.length - 3}...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Описание букета */}
        {bouquet.description && (
          <p className="text-gray-600 text-xs md:text-sm mb-4 line-clamp-2">{bouquet.description}</p>
        )}
        
        {/* Цена и кнопка добавления в корзину */}
        <div className="flex items-center justify-between gap-3">
          <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            {bouquet.price} ₽
          </div>
          
          {isOutOfStock ? (
            // Кнопка "Нет" для товара без остатков
            <Button 
              disabled
              className="bg-gray-400 text-white rounded-full px-4 cursor-not-allowed text-sm shrink-0"
            >
              Нет
            </Button>
          ) : quantity === 0 ? (
            // Кнопка "В корзину" если товар еще не добавлен
            <Button 
              onClick={onAddToCart}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full px-4 md:px-6 shadow-lg text-sm md:text-base shrink-0"
            >
              <ShoppingCart className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">В корзину</span>
            </Button>
          ) : (
            // Счетчик количества если товар уже в корзине
            <div className="flex items-center gap-1 bg-gradient-to-r from-pink-50 to-purple-50 rounded-full p-1 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onUpdateQuantity(bouquet.id, "bouquet", -1)}
                className="w-8 h-8 rounded-full hover:bg-white"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="font-bold text-base min-w-[2rem] text-center">{quantity}</span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onUpdateQuantity(bouquet.id, "bouquet", 1)}
                disabled={!canAddMore}
                className="w-8 h-8 rounded-full hover:bg-white disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
