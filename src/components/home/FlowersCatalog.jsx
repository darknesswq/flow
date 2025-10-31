
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Sparkles, Minus } from "lucide-react";
import { motion } from "framer-motion";

export default function FlowersCatalog({ flowers, isLoading, onAddToCart, onUpdateQuantity, getItemQuantity }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {Array(10).fill(0).map((_, i) => (
          <div key={i} className="aspect-square bg-white rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (flowers.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl">
        <Sparkles className="w-12 md:w-16 h-12 md:h-16 text-pink-300 mx-auto mb-4" />
        <p className="text-gray-500 text-base md:text-lg">Цветы скоро появятся в каталоге</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
      {flowers.map((flower, index) => {
        const quantity = getItemQuantity(flower.id, "flower");
        const stockQty = flower.stock_quantity || 0;
        const isOutOfStock = stockQty === 0;
        const isLowStock = stockQty < 10 && stockQty > 0;
        const canAddMore = quantity < stockQty;
        
        return (
          <motion.div
            key={flower.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
          >
            <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-pink-50 to-purple-50">
              {flower.image_url ? (
                <img 
                  src={flower.image_url} 
                  alt={flower.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Sparkles className="w-8 md:w-10 h-8 md:h-10 text-pink-300" />
                </div>
              )}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center">
                  <span className="text-white font-medium text-xs md:text-sm px-2 text-center">Нет в наличии</span>
                </div>
              )}
              {!isOutOfStock && isLowStock && (
                <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium">
                  {stockQty} шт
                </div>
              )}
            </div>
            <div className="p-3 md:p-4">
              <div className="flex items-start justify-between mb-2 gap-2">
                <h3 className="text-xs md:text-sm font-bold text-gray-900 line-clamp-1 flex-1">{flower.name}</h3>
                <Badge 
                  variant="secondary" 
                  className="text-[10px] md:text-xs flex-shrink-0"
                  style={{
                    background: getColorBackground(flower.color),
                    color: getColorText(flower.color)
                  }}
                >
                  {flower.color}
                </Badge>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-base md:text-lg font-bold text-pink-600">{flower.price} ₽</span>
                
                {isOutOfStock ? (
                  <Button 
                    size="sm"
                    disabled
                    className="rounded-full w-8 h-8 p-0 bg-gray-400 cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </Button>
                ) : quantity === 0 ? (
                  <Button 
                    size="sm"
                    className="rounded-full w-8 h-8 p-0 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                    onClick={() => onAddToCart(flower, "flower")}
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </Button>
                ) : (
                  <div className="flex items-center gap-1 bg-gradient-to-r from-pink-50 to-purple-50 rounded-full p-0.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onUpdateQuantity(flower.id, "flower", -1)}
                      className="w-7 h-7 rounded-full hover:bg-white"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="font-bold text-xs md:text-sm min-w-[1.5rem] text-center">{quantity}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onAddToCart(flower, "flower")}
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
    </div>
  );
}

function getColorBackground(color) {
  const colorMap = {
    'красный': '#fee2e2',
    'розовый': '#fce7f3',
    'белый': '#f9fafb',
    'желтый': '#fef3c7',
    'оранжевый': '#ffedd5',
    'фиолетовый': '#f3e8ff',
    'синий': '#dbeafe',
    'микс': '#f3f4f6'
  };
  return colorMap[color] || '#f3f4f6';
}

function getColorText(color) {
  const colorMap = {
    'красный': '#991b1b',
    'розовый': '#9f1239',
    'белый': '#374151',
    'желтый': '#92400e',
    'оранжевый': '#9a3412',
    'фиолетовый': '#6b21a8',
    'синий': '#1e40af',
    'микс': '#374151'
  };
  return colorMap[color] || '#374151';
}
