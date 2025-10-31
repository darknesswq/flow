import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingCart, Sparkles, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

import FlowerSelector from "../components/builder/FlowerSelector";
import BouquetPreview from "../components/builder/BouquetPreview";
import BuilderSummary from "../components/builder/BuilderSummary";

export default function BouquetBuilder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFlowers, setSelectedFlowers] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showFloatingButton, setShowFloatingButton] = useState(true);
  const bouquetPreviewRef = useRef(null);

  const { data: flowers, isLoading } = useQuery({
    queryKey: ['flowers'],
    queryFn: () => base44.entities.Flower.filter({ in_stock: true }, '-created_date'),
    initialData: [],
  });

  useEffect(() => {
    const handleScroll = () => {
      if (!bouquetPreviewRef.current) return;

      const rect = bouquetPreviewRef.current.getBoundingClientRect();
      const isVisible = rect.top >= 0 && rect.top <= window.innerHeight;
      
      setShowFloatingButton(!isVisible);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBouquet = () => {
    bouquetPreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const filteredFlowers = categoryFilter === "all" 
    ? flowers 
    : flowers.filter(f => f.category === categoryFilter);

  const addFlower = (flower) => {
    const stockQty = flower.stock_quantity || 0;
    const existing = selectedFlowers.find(f => f.id === flower.id);
    const currentQuantity = existing ? existing.quantity : 0;
    
    if (stockQty === 0) {
      toast({
        title: "Товар закончился",
        description: `${flower.name} нет в наличии`,
        duration: 2000,
      });
      return;
    }
    
    if (currentQuantity >= stockQty) {
      toast({
        title: "Недостаточно товара",
        description: `Доступно только ${stockQty} шт`,
        duration: 2000,
      });
      return;
    }
    
    if (existing) {
      setSelectedFlowers(selectedFlowers.map(f => 
        f.id === flower.id ? { ...f, quantity: f.quantity + 1 } : f
      ));
    } else {
      setSelectedFlowers([...selectedFlowers, { ...flower, quantity: 1 }]);
    }
  };

  const removeFlower = (flowerId) => {
    setSelectedFlowers(selectedFlowers.filter(f => f.id !== flowerId));
  };

  const updateQuantity = (flowerId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFlower(flowerId);
    } else {
      const flower = flowers.find(f => f.id === flowerId);
      const stockQty = flower?.stock_quantity || 0;
      
      if (newQuantity > stockQty) {
        toast({
          title: "Недостаточно товара",
          description: `Доступно только ${stockQty} шт`,
          duration: 2000,
        });
        return;
      }
      
      setSelectedFlowers(selectedFlowers.map(f => 
        f.id === flowerId ? { ...f, quantity: newQuantity } : f
      ));
    }
  };

  const getTotalPrice = () => {
    return selectedFlowers.reduce((sum, f) => sum + (f.price * f.quantity), 0);
  };

  const getTotalFlowers = () => {
    return selectedFlowers.reduce((sum, f) => sum + f.quantity, 0);
  };

  const handleAddToCart = () => {
    const customBouquet = {
      id: `custom-${Date.now()}`,
      name: "Собственный букет",
      type: "custom",
      price: getTotalPrice(),
      quantity: 1,
      flowers: selectedFlowers.map(f => ({
        flower_id: f.id,
        flower_name: f.name,
        quantity: f.quantity,
        price: f.price
      }))
    };

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    cart.push(customBouquet);
    localStorage.setItem("cart", JSON.stringify(cart));
    
    toast({
      title: "Букет добавлен в корзину",
      description: `Ваш букет из ${getTotalFlowers()} цветов добавлен`,
      duration: 1500,
    });

    setSelectedFlowers([]);
    navigate(createPageUrl("Cart"));
  };

  const categories = ["all", ...new Set(flowers.map(f => f.category))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4 md:p-8 pt-20 md:pt-8">
      <div className="max-w-7xl mx-auto">
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
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Конструктор букетов
            </h1>
            <p className="text-gray-600 mt-1">Создайте свой уникальный букет</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-pink-500" />
                  Выберите цветы
                </h2>
                <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
                  <TabsList className="bg-pink-50">
                    <TabsTrigger value="all">Все</TabsTrigger>
                    <TabsTrigger value="розы">Розы</TabsTrigger>
                    <TabsTrigger value="тюльпаны">Тюльпаны</TabsTrigger>
                    <TabsTrigger value="пионы">Пионы</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <FlowerSelector 
                flowers={filteredFlowers}
                isLoading={isLoading}
                onAddFlower={addFlower}
                selectedFlowers={selectedFlowers}
              />
            </div>
          </div>

          <div className="lg:col-span-1" ref={bouquetPreviewRef}>
            <div className="sticky top-8 space-y-6">
              <BouquetPreview 
                selectedFlowers={selectedFlowers}
                onUpdateQuantity={updateQuantity}
                onRemoveFlower={removeFlower}
              />
              
              <BuilderSummary 
                selectedFlowers={selectedFlowers}
                totalPrice={getTotalPrice()}
                totalFlowers={getTotalFlowers()}
                onAddToCart={handleAddToCart}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Плавающая кнопка "Мой букет" */}
      <AnimatePresence>
        {showFloatingButton && selectedFlowers.length > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="fixed bottom-6 right-6 z-40 lg:hidden"
          >
            <Button
              onClick={scrollToBouquet}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full shadow-2xl h-16 px-6 flex items-center gap-3 group"
            >
              <div className="flex flex-col items-start">
                <span className="text-sm font-bold">Мой букет</span>
                <div className="flex items-center gap-2">
                  <Badge className="bg-white/20 text-white text-xs">
                    {getTotalFlowers()} шт
                  </Badge>
                  <span className="text-xs font-medium">
                    {getTotalPrice().toFixed(0)} ₽
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <ChevronDown className="w-5 h-5 animate-bounce" />
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}