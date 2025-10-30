
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Sparkles, Check } from "lucide-react";
import { motion } from "framer-motion";

export default function FlowerSelector({ flowers, isLoading, onAddFlower, selectedFlowers }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array(8).fill(0).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (flowers.length === 0) {
    return (
      <div className="text-center py-12">
        <Sparkles className="w-16 h-16 text-pink-300 mx-auto mb-4" />
        <p className="text-gray-500">Нет доступных цветов</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {flowers.map((flower, index) => {
        const isSelected = selectedFlowers.some(f => f.id === flower.id);
        const selectedQuantity = selectedFlowers.find(f => f.id === flower.id)?.quantity || 0;
        const stockQty = flower.stock_quantity || 0;
        const isOutOfStock = stockQty === 0;
        const isLowStock = stockQty < 10 && stockQty > 0;
        const canAddMore = selectedQuantity < stockQty;
        
        return (
          <motion.div
            key={flower.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`relative group bg-gradient-to-br from-white to-pink-50 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ${
              isSelected ? 'ring-2 ring-pink-500' : ''
            }`}
          >
            <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100">
              <div className={isOutOfStock ? 'filter blur-sm' : ''}>
                {flower.image_url ? (
                  <img 
                    src={flower.image_url} 
                    alt={flower.name}
                    className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${
                      isOutOfStock ? 'opacity-40' : ''
                    }`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sparkles className={`w-10 h-10 text-pink-300 ${isOutOfStock ? 'opacity-40' : ''}`} />
                  </div>
                )}
              </div>
              
              {isOutOfStock && (
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 to-gray-900/90 flex items-center justify-center z-10">
                  <div className="text-center px-2">
                    <p className="text-white font-bold text-base drop-shadow-lg">Товар закончился</p>
                  </div>
                </div>
              )}
              
              {!isOutOfStock && isSelected && (
                <div className="absolute top-2 right-2 bg-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg z-10">
                  <Check className="w-4 h-4" />
                </div>
              )}
              
              {!isOutOfStock && isLowStock && !isSelected && (
                <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg z-10">
                  {stockQty} шт
                </div>
              )}
            </div>
            
            <div className={`p-3 ${isOutOfStock ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{flower.name}</h3>
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                  style={{
                    background: getColorBackground(flower.color),
                    color: getColorText(flower.color)
                  }}
                >
                  {flower.color}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <span className="text-base font-bold text-pink-600">{flower.price} ₽</span>
                <Button 
                  size="sm"
                  onClick={() => onAddFlower(flower)}
                  disabled={isOutOfStock || !canAddMore}
                  className={`rounded-full w-8 h-8 p-0 ${
                    isOutOfStock || !canAddMore
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'
                  }`}
                >
                  <Plus className="w-4 h-4 text-white" />
                </Button>
              </div>
              
              {!isOutOfStock && isSelected && selectedQuantity > 0 && (
                <div className="mt-2 text-center text-xs font-medium text-pink-600">
                  В букете: {selectedQuantity} шт
                </div>
              )}
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
