import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Package, Sparkles, RefreshCw, Phone, Star, Truck, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

export default function Orders() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [reviewingOrder, setReviewingOrder] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating_product: 0,
    rating_delivery: 0,
    review_comment: ""
  });

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['user-orders'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.Order.filter({ created_by: user.email }, '-created_date');
    },
    initialData: [],
    refetchInterval: 5000,
  });

  const submitReviewMutation = useMutation({
    mutationFn: ({ orderId, data }) => base44.entities.Order.update(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      setReviewingOrder(null);
      setReviewData({ rating_product: 0, rating_delivery: 0, review_comment: "" });
      toast({
        title: "Спасибо за отзыв!",
        description: "Ваша оценка очень важна для нас",
        duration: 2000,
      });
    },
  });

  const handleSubmitReview = (orderId, deliveryType) => {
    if (reviewData.rating_product === 0) {
      toast({
        title: "Пожалуйста, оцените товар",
        description: "Оценка товара обязательна",
        duration: 2000,
      });
      return;
    }

    if (deliveryType === 'доставка' && reviewData.rating_delivery === 0) {
      toast({
        title: "Пожалуйста, оцените доставку",
        description: "Оценка доставки обязательна",
        duration: 2000,
      });
      return;
    }

    const dataToSubmit = {
      rating_product: reviewData.rating_product,
      rating_delivery: deliveryType === 'самовывоз' ? 5 : reviewData.rating_delivery,
      review_comment: reviewData.review_comment,
      review_date: new Date().toISOString()
    };

    submitReviewMutation.mutate({
      orderId,
      data: dataToSubmit
    });
  };

  const canReview = (order) => {
    return (order.status === 'доставлен' || order.status === 'выдан') && !order.rating_product;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
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
                Мои заказы
              </h1>
              <p className="text-gray-600 mt-1">История ваших покупок</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            className="rounded-full hover:bg-pink-50"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-48 bg-white rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <Package className="w-16 h-16 text-pink-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Пока нет заказов</h2>
            <p className="text-gray-600 mb-6">Создайте свой первый букет</p>
            <Button
              onClick={() => navigate(createPageUrl("BouquetBuilder"))}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full px-6"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Создать букет
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h3 className="text-xl font-bold text-gray-900">
                        Заказ #{order.id.slice(0, 8)}
                      </h3>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      {format(new Date(order.created_date), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                    </p>

                    {order.status === 'в_пути' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-2xl"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                            <Phone className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-indigo-900 mb-1">Курьер в пути!</p>
                            <p className="text-sm text-indigo-700">
                              Наш курьер скоро свяжется с вами для уточнения времени доставки. Пожалуйста, держите телефон под рукой.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {canReview(order) && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Star className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-green-900 mb-3">Оцените ваш заказ</p>
                            
                            {reviewingOrder === order.id ? (
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Качество товара</p>
                                  <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((rating) => (
                                      <button
                                        key={rating}
                                        type="button"
                                        onClick={() => setReviewData({...reviewData, rating_product: rating})}
                                        className="transition-transform hover:scale-110"
                                      >
                                        <Star
                                          className={`w-8 h-8 ${
                                            rating <= reviewData.rating_product
                                              ? 'fill-yellow-400 text-yellow-400'
                                              : 'text-gray-300'
                                          }`}
                                        />
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {order.delivery_type === 'доставка' && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Качество доставки</p>
                                    <div className="flex gap-2">
                                      {[1, 2, 3, 4, 5].map((rating) => (
                                        <button
                                          key={rating}
                                          type="button"
                                          onClick={() => setReviewData({...reviewData, rating_delivery: rating})}
                                          className="transition-transform hover:scale-110"
                                        >
                                          <Star
                                            className={`w-8 h-8 ${
                                              rating <= reviewData.rating_delivery
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-gray-300'
                                            }`}
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Комментарий (необязательно)</p>
                                  <Textarea
                                    value={reviewData.review_comment}
                                    onChange={(e) => setReviewData({...reviewData, review_comment: e.target.value})}
                                    placeholder="Поделитесь впечатлениями о заказе..."
                                    rows={3}
                                    className="rounded-xl resize-none"
                                  />
                                </div>

                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setReviewingOrder(null);
                                      setReviewData({ rating_product: 0, rating_delivery: 0, review_comment: "" });
                                    }}
                                    className="rounded-full"
                                  >
                                    Отмена
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleSubmitReview(order.id, order.delivery_type)}
                                    disabled={submitReviewMutation.isPending}
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-full"
                                  >
                                    {submitReviewMutation.isPending ? "Отправка..." : "Отправить отзыв"}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => setReviewingOrder(order.id)}
                                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-full"
                              >
                                Оценить заказ
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {order.rating_product && (
                      <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200 rounded-2xl">
                        <p className="font-medium text-gray-900 mb-2">Ваша оценка:</p>
                        <div className="flex items-center gap-4 text-sm text-gray-700 flex-wrap">
                          <div className="flex items-center gap-1">
                            <span>Товар:</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < order.rating_product ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {order.delivery_type === 'доставка' && (
                            <div className="flex items-center gap-1">
                              <span>Доставка:</span>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < order.rating_delivery ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {order.review_comment && (
                          <p className="text-sm text-gray-600 mt-2 italic">"{order.review_comment}"</p>
                        )}
                      </div>
                    )}

                    <div className="relative mb-4">
                      <div className="flex items-center justify-between">
                        {getStatusSteps(order.delivery_type).map((step, idx) => {
                          const currentStepIndex = getStatusSteps(order.delivery_type).findIndex(s => s.value === order.status);
                          const isCompleted = idx <= currentStepIndex;
                          const isCurrent = idx === currentStepIndex;
                          
                          return (
                            <div key={step.value} className="flex flex-col items-center flex-1 relative">
                              {idx > 0 && (
                                <div className={`absolute top-4 right-1/2 w-full h-1 ${isCompleted ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-gray-200'}`} style={{ zIndex: 0 }} />
                              )}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 relative z-10 transition-all duration-300 ${
                                isCurrent ? 'bg-gradient-to-r from-pink-500 to-purple-500 scale-110 shadow-lg' :
                                isCompleted ? 'bg-gradient-to-r from-pink-400 to-purple-400' :
                                'bg-gray-200'
                              }`}>
                                <step.icon className={`w-4 h-4 ${isCompleted ? 'text-white' : 'text-gray-400'}`} />
                              </div>
                              <p className={`text-xs text-center ${isCurrent ? 'font-bold text-pink-600' : 'text-gray-500'}`}>
                                {step.label}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {order.delivery_address && (
                      <p className="text-gray-700 mb-2 text-sm">
                        <span className="font-medium">Адрес:</span> {order.delivery_address}
                      </p>
                    )}
                    {order.delivery_date && (
                      <p className="text-gray-700 mb-2 text-sm">
                        <span className="font-medium">Дата доставки:</span>{' '}
                        {format(new Date(order.delivery_date), 'dd MMMM yyyy', { locale: ru })}
                        {order.delivery_time && `, ${order.delivery_time}`}
                      </p>
                    )}
                    {order.recipient_name && (
                      <p className="text-gray-700 text-sm">
                        <span className="font-medium">Получатель:</span> {order.recipient_name}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <p className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {order.total_amount} ₽
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {order.delivery_type}
                    </Badge>
                    <div className="mt-2">
                      <Badge className="bg-green-100 text-green-800">
                        💰 Оплата при получении
                      </Badge>
                    </div>
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4 mt-4">
                    <p className="font-medium text-gray-900 mb-2">Товары:</p>
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-sm text-gray-700">
                          • {item.name} - {item.quantity} шт × {item.price} ₽
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusColor(status) {
  const colors = {
    'новый': 'bg-blue-100 text-blue-800',
    'в_обработке': 'bg-yellow-100 text-yellow-800',
    'собирается': 'bg-purple-100 text-purple-800',
    'в_пути': 'bg-indigo-100 text-indigo-800',
    'доставлен': 'bg-green-100 text-green-800',
    'готов_к_выдаче': 'bg-teal-100 text-teal-800',
    'выдан': 'bg-emerald-100 text-emerald-800',
    'отменен': 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function getStatusText(status) {
  const texts = {
    'новый': 'Создан',
    'в_обработке': 'В обработке',
    'собирается': 'Собирается',
    'в_пути': 'В пути',
    'доставлен': 'Доставлен',
    'готов_к_выдаче': 'Готов к выдаче',
    'выдан': 'Выдан',
    'отменен': 'Отменен'
  };
  return texts[status] || status;
}

function getStatusSteps(deliveryType) {
  const deliverySteps = [
    { value: 'новый', label: 'Создан', icon: Package },
    { value: 'в_обработке', label: 'Обработка', icon: Package },
    { value: 'собирается', label: 'Сборка', icon: Sparkles },
    { value: 'в_пути', label: 'В пути', icon: Truck },
    { value: 'доставлен', label: 'Доставлен', icon: CheckCircle },
  ];

  const pickupSteps = [
    { value: 'новый', label: 'Создан', icon: Package },
    { value: 'в_обработке', label: 'Обработка', icon: Package },
    { value: 'собирается', label: 'Сборка', icon: Sparkles },
    { value: 'готов_к_выдаче', label: 'Готов', icon: Package },
    { value: 'выдан', label: 'Выдан', icon: CheckCircle },
  ];

  return deliveryType === 'самовывоз' ? pickupSteps : deliverySteps;
}