import React from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Flower2, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

export default function BuilderSummary({ selectedFlowers, totalPrice, totalFlowers, onAddToCart }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-xl p-6"
    >
      <h2 className="text-xl font-bold text-gray-900 mb-4">Итого</h2>
      
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-400 rounded-lg flex items-center justify-center">
              <Flower2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-gray-700">Цветов</span>
          </div>
          <span className="text-lg font-bold text-gray-900">{totalFlowers} шт</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-gray-700">Стоимость</span>
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            {totalPrice.toFixed(0)} ₽
          </span>
        </div>
      </div>

      <Button
        onClick={onAddToCart}
        disabled={selectedFlowers.length === 0}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-lg py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        <ShoppingCart className="w-5 h-5 mr-2" />
        {selectedFlowers.length === 0 ? 'Добавьте цветы' : 'Добавить в корзину'}
      </Button>

      {selectedFlowers.length > 0 && (
        <p className="text-center text-xs text-gray-500 mt-3">
          Вы сможете указать детали доставки на следующем шаге
        </p>
      )}
    </motion.div>
  );
}