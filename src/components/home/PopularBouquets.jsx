
import React, { useState } from "react";
import { Sparkles, Heart, Star, ShoppingCart, Plus, Minus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function PopularBouquets({ bouquets, isLoading, onAddToCart, onUpdateQuantity, getItemQuantity }) {
  const [showAll, setShowAll] = useState(false);
  
  if (isLoading || bouquets.length === 0) return null;

  const displayedBouquets = showAll ? bouquets : bouquets.slice(0, 2);
  const hasMore = bouquets.length > 2;

  return (
    <div className="mb-12 md:mb-16 w-full">
      <div className="flex items-center gap-3 mb-6 md:mb-8 px-1">
        <Star className="w-6 h-6 md:w-8 md:h-8 text-amber-500 shrink-0" />
        <h2 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
          Популярные букеты
        </h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        <AnimatePresence>
          {displayedBouquets.map((bouquet, index) => {
            const quantity = getItemQuantity(bouquet.id, "bouquet");
            const stockQty = bouquet.stock_quantity || 0;
            const isOutOfStock = stockQty === 0;
            const isLowStock = stockQty < 5 && stockQty > 0;
            const canAddMore = quantity < stockQty;
            
            return (
              <motion.div
                key={bouquet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 w-full"
              >
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100">
                  {bouquet.image_url ? (
                    <img 
                      src={bouquet.image_url} 
                      alt={bouquet.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-pink-300" />
                    </div>
                  )}
                  {isOutOfStock ? (
                    <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center">
                      <span className="text-white font-bold text-sm px-4 text-center">Нет в наличии</span>
                    </div>
                  ) : (
                    <>
                      {isLowStock && (
                        <div className="absolute top-2 md:top-3 left-2 md:left-3 bg-amber-500 text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-sm font-medium shadow-lg">
                          <span className="hidden sm:inline">Осталось {stockQty} шт</span>
                          <span className="sm:hidden">{stockQty} шт</span>
                        </div>
                      )}
                      <div className="absolute top-2 md:top-3 right-2 md:right-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white p-1.5 md:p-2 rounded-full shadow-lg">
                        <Star className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" />
                      </div>
                    </>
                  )}
                </div>
                <div className="p-4 md:p-5">
                  <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 line-clamp-1">{bouquet.name}</h3>
                  
                  {bouquet.size && (
                    <p className="text-xs text-gray-500 mb-2">
                      Размер: <span className="font-medium text-gray-700">{bouquet.size} см</span>
                    </p>
                  )}

                  {bouquet.composition && bouquet.composition.length > 0 && (
                    <div className="mb-3 p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                      <p className="text-xs font-bold text-purple-900 mb-1">Состав:</p>
                      <div className="space-y-0.5">
                        {bouquet.composition.slice(0, 2).map((flower, idx) => (
                          <p key={idx} className="text-xs text-purple-700">
                            • {flower.flower_name} - {flower.quantity} шт
                          </p>
                        ))}
                        {bouquet.composition.length > 2 && (
                          <p className="text-xs text-purple-600 italic">
                            и ещё {bouquet.composition.length - 2}...
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <div className="text-lg md:text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                      {bouquet.price} ₽
                    </div>
                    
                    {isOutOfStock ? (
                      <Button 
                        size="sm"
                        disabled
                        className="bg-gray-400 text-white rounded-full cursor-not-allowed shrink-0"
                      >
                        Нет
                      </Button>
                    ) : quantity === 0 ? (
                      <Button 
                        size="sm"
                        onClick={() => onAddToCart(bouquet, "bouquet")}
                        className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full shadow-md shrink-0"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1 bg-gradient-to-r from-pink-50 to-purple-50 rounded-full p-0.5 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onUpdateQuantity(bouquet.id, "bouquet", -1)}
                          className="w-7 h-7 rounded-full hover:bg-white"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="font-bold text-sm min-w-[1.5rem] text-center">{quantity}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onUpdateQuantity(bouquet.id, "bouquet", 1)}
                          disabled={!canAddMore}
                          className="w-7 h-7 rounded-full hover:bg-white disabled:opacity-50"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {hasMore && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center mt-6 md:mt-8"
        >
          <Button
            onClick={() => setShowAll(!showAll)}
            variant="outline"
            className="rounded-full border-2 border-pink-300 hover:bg-pink-50 px-6 md:px-8 py-5 md:py-6 text-base md:text-lg font-medium transition-all duration-300"
          >
            {showAll ? (
              <>
                Скрыть
                <ChevronDown className="w-5 h-5 ml-2 rotate-180 transition-transform duration-300" />
              </>
            ) : (
              <>
                Показать больше ({bouquets.length - 2})
                <ChevronDown className="w-5 h-5 ml-2 transition-transform duration-300" />
              </>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
