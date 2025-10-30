import React from "react";
import { Heart, Cake, Gift, Sparkles, Church } from "lucide-react";
import { motion } from "framer-motion";

const occasions = [
  { 
    name: "Романтика", 
    icon: Heart, 
    gradient: "from-pink-400 to-rose-500",
    bg: "from-pink-50 to-rose-50",
    value: "романтика"
  },
  { 
    name: "День рождения", 
    icon: Cake, 
    gradient: "from-purple-400 to-indigo-500",
    bg: "from-purple-50 to-indigo-50",
    value: "день_рождения"
  },
  { 
    name: "Благодарность", 
    icon: Gift, 
    gradient: "from-emerald-400 to-teal-500",
    bg: "from-emerald-50 to-teal-50",
    value: "благодарность"
  },
  { 
    name: "Просто так", 
    icon: Sparkles, 
    gradient: "from-amber-400 to-orange-500",
    bg: "from-amber-50 to-orange-50",
    value: "просто_так"
  },
  { 
    name: "Свадьба", 
    icon: Church, 
    gradient: "from-fuchsia-400 to-pink-500",
    bg: "from-fuchsia-50 to-pink-50",
    value: "свадьба"
  },
];

export default function OccasionSection({ onOccasionSelect }) {
  return (
    <div className="mb-12 md:mb-16 w-full">
      <h2 className="text-xl md:text-3xl font-bold text-center mb-6 md:mb-8 text-gray-900 px-4">
        Букеты по случаю
      </h2>
      
      <div className="w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {occasions.map((occasion, index) => (
            <motion.div
              key={occasion.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => onOccasionSelect(occasion.value)}
              className="group cursor-pointer bg-gradient-to-br from-white to-gray-50 rounded-2xl md:rounded-3xl p-4 md:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 w-full"
            >
              <div className={`w-12 h-12 md:w-16 md:h-16 mb-3 md:mb-4 bg-gradient-to-br ${occasion.gradient} rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mx-auto`}>
                <occasion.icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-1 text-center">{occasion.name}</h3>
              <p className="text-xs text-gray-600 text-center">Смотреть</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}