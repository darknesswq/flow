import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus, Sparkles, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BouquetPreview({ selectedFlowers, onUpdateQuantity, onRemoveFlower }) {
  if (selectedFlowers.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-pink-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Ваш букет пуст</h3>
          <p className="text-sm text-gray-600">Выберите цветы из каталога ниже</p>
        </div>
      </div>
    );
  }

  // Группировка по категориям
  const groupedFlowers = selectedFlowers.reduce((acc, flower) => {
    const category = flower.category || 'Другие';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(flower);
    return acc;
  }, {});

  const getTotalItems = () => {
    return selectedFlowers.reduce((sum, f) => sum + f.quantity, 0);
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
      {/* Заголовок */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-5">
        <div className="flex items-start justify-between text-white gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold truncate">Ваш букет</h2>
              <p className="text-sm text-white/80 truncate">{selectedFlowers.length} {selectedFlowers.length === 1 ? 'вид' : 'видов'} цветов</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-white/80 whitespace-nowrap">Всего стеблей</p>
            <p className="text-2xl font-bold">{getTotalItems()}</p>
          </div>
        </div>
      </div>

      {/* Список цветов */}
      <div className="p-5">
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          <AnimatePresence>
            {Object.entries(groupedFlowers).map(([category, flowers]) => (
              <div key={category}>
                {/* Заголовок категории */}
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-pink-500 flex-shrink-0" />
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide truncate">{category}</h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-pink-200 to-transparent min-w-[20px]"></div>
                </div>

                {/* Цветы в категории */}
                <div className="space-y-3 mb-4">
                  {flowers.map((flower) => (
                    <motion.div
                      key={flower.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="group"
                    >
                      <div className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl border-2 border-transparent hover:border-pink-200 transition-all duration-200">
                        {/* Верхняя часть - изображение и информация */}
                        <div className="flex items-start gap-3 mb-3">
                          {/* Изображение */}
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 flex-shrink-0 shadow-md">
                            {flower.image_url ? (
                              <img 
                                src={flower.image_url} 
                                alt={flower.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-pink-300" />
                              </div>
                            )}
                          </div>
                          
                          {/* Информация */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 mb-1 truncate">{flower.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                              <span className="font-medium text-pink-600 whitespace-nowrap">{flower.price} ₽</span>
                              <span>×</span>
                              <span className="whitespace-nowrap">{flower.quantity} шт</span>
                            </div>
                            <div className="mt-1">
                              <span className="text-xs font-bold text-purple-600 whitespace-nowrap">
                                = {(flower.price * flower.quantity).toFixed(0)} ₽
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Нижняя часть - управление */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/50">
                          <div className="flex items-center gap-1 bg-white rounded-full p-1 shadow-sm">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 rounded-full hover:bg-pink-100 flex-shrink-0"
                              onClick={() => onUpdateQuantity(flower.id, flower.quantity - 1)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-10 text-center font-bold text-sm">{flower.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 rounded-full hover:bg-pink-100 flex-shrink-0"
                              onClick={() => onUpdateQuantity(flower.id, flower.quantity + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full h-8 px-3 flex-shrink-0"
                            onClick={() => onRemoveFlower(flower.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            <span className="text-xs">Удалить</span>
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}