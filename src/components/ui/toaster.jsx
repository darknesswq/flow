import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, Info, AlertCircle, X, Sparkles } from "lucide-react"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:top-auto sm:right-4 sm:bottom-4 sm:flex-col md:max-w-[420px] pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts
          .filter((toast) => toast.open !== false)
          .map(function ({ id, title, description, action, ...props }) {
            return (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0, y: 50, scale: 0.3 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.5,
                  y: 20,
                  transition: { duration: 0.2 }
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
                className="pointer-events-auto relative mb-4"
              >
                <div className="group relative flex w-full items-start gap-4 overflow-hidden rounded-2xl border-none bg-white p-5 pr-12 shadow-2xl backdrop-blur-sm">
                  {/* Градиентный фон */}
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-50 via-purple-50 to-pink-50 opacity-80" />
                  
                  {/* Декоративные элементы */}
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br from-pink-200/30 to-purple-200/30 rounded-full blur-2xl" />
                  <div className="absolute -left-5 -bottom-5 w-20 h-20 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-xl" />
                  
                  {/* Иконка */}
                  <div className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-400 to-purple-500 shadow-lg">
                    <Sparkles className="h-6 w-6 text-white animate-pulse" />
                  </div>

                  {/* Контент */}
                  <div className="relative z-10 flex-1 space-y-1">
                    {title && (
                      <div className="text-base font-bold text-gray-900">
                        {title}
                      </div>
                    )}
                    {description && (
                      <div className="text-sm text-gray-700">
                        {description}
                      </div>
                    )}
                    {action}
                  </div>

                  {/* Кнопка закрытия */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      dismiss(id)
                    }}
                    className="relative z-10 absolute right-3 top-3 rounded-full p-1.5 hover:bg-white/80 transition-all duration-200 hover:scale-110"
                  >
                    <X className="h-4 w-4 text-gray-600 hover:text-gray-900" />
                  </button>

                  {/* Прогресс бар */}
                  <motion.div
                    className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 shadow-lg"
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 1, ease: "linear" }}
                  />
                </div>
              </motion.div>
            )
          })}
      </AnimatePresence>
    </div>
  )
}