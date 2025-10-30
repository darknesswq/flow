import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Sparkles, Truck, Clock, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-purple-50 pt-6 md:pt-12 pb-10 md:pb-20">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 md:w-96 h-80 md:h-96 bg-pink-200 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 md:w-96 h-80 md:h-96 bg-purple-200 rounded-full opacity-20 blur-3xl" />
      </div>
      
      <div className="relative w-full max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full"
          >
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 md:px-4 md:py-2 rounded-full mb-4 md:mb-6 shadow-lg">
              <Award className="w-3 h-3 md:w-4 md:h-4 text-pink-600 shrink-0" />
              <span className="text-xs md:text-sm font-medium text-gray-700 truncate">Лучший сервис доставки 2024</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight">
              <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Создайте
              </span>
              <br />
              <span className="text-gray-900">идеальный букет</span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-xl text-gray-600 mb-6 md:mb-8">
              Уникальный конструктор букетов и доставка свежих цветов в день заказа
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 mb-8 md:mb-12 w-full">
              <Link to={createPageUrl("BouquetBuilder")} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-sm sm:text-base md:text-lg px-6 md:px-8 py-5 md:py-6 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 mr-2 shrink-0" />
                  Собрать букет
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={() => document.getElementById("catalog-section")?.scrollIntoView({ behavior: "smooth" })}
                className="w-full sm:w-auto text-sm sm:text-base md:text-lg px-6 md:px-8 py-5 md:py-6 rounded-full border-2 border-pink-300 hover:bg-pink-50 transition-all duration-300"
              >
                Смотреть каталог
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3 md:gap-6">
              <FeatureItem icon={Truck} text="Доставка за 2 часа" />
              <FeatureItem icon={Clock} text="Работаем 24/7" />
              <FeatureItem icon={Sparkles} text="Свежие цветы" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden md:block w-full"
          >
            <div className="relative w-full h-[400px] md:h-[500px] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&q=80"
                alt="Красивый букет цветов"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-pink-900/20 to-transparent" />
            </div>
            
            <div className="absolute -bottom-4 md:-bottom-6 -right-4 md:-right-6 bg-white rounded-2xl md:rounded-3xl p-3 md:p-6 shadow-2xl">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 md:w-12 h-10 md:h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                  <Award className="w-5 md:w-6 h-5 md:h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-base md:text-lg">4.9★</p>
                  <p className="text-xs md:text-sm text-gray-600">1000+ отзывов</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-10 md:w-12 h-10 md:h-12 bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl md:rounded-2xl flex items-center justify-center mb-2 shrink-0">
        <Icon className="w-4 md:w-6 h-4 md:h-6 text-pink-600" />
      </div>
      <p className="text-xs md:text-sm font-medium text-gray-700 leading-tight">{text}</p>
    </div>
  );
}