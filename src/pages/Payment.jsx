import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Lock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

export default function Payment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvv: ""
  });
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success' | 'error'

  // Получить параметры из URL
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');
  const amount = urlParams.get('amount');

  const { data: order } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => base44.entities.Order.filter({ id: orderId }),
    enabled: !!orderId,
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, data }) => base44.entities.Order.update(orderId, data),
  });

  const handlePayment = async (e) => {
    e.preventDefault();
    setProcessing(true);

    // Имитация обработки платежа (в реальном приложении здесь был бы API запрос)
    setTimeout(async () => {
      // Валидация номера карты (простая проверка)
      const cardNumberClean = paymentData.cardNumber.replace(/\s/g, '');
      
      if (cardNumberClean.length === 16) {
        // Успешная оплата
        setPaymentStatus('success');
        
        // Обновить статус оплаты заказа
        await updateOrderMutation.mutateAsync({
          orderId: orderId,
          data: { payment_status: 'оплачен' }
        });

        toast({
          title: "Оплата успешна!",
          description: "Ваш заказ оплачен и передан в обработку",
          duration: 2000,
        });

        // Перенаправить на страницу заказов через 2 секунды
        setTimeout(() => {
          navigate(createPageUrl("Orders"));
        }, 2000);
      } else {
        // Ошибка оплаты
        setPaymentStatus('error');
        toast({
          title: "Ошибка оплаты",
          description: "Проверьте данные карты и попробуйте снова",
          duration: 2000,
        });
      }
      
      setProcessing(false);
    }, 2000);
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  if (!orderId || !amount) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ошибка</h2>
          <p className="text-gray-600 mb-4">Неверные параметры оплаты</p>
          <Button onClick={() => navigate(createPageUrl("Home"))}>
            На главную
          </Button>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Оплата успешна!</h2>
          <p className="text-gray-600 mb-4">Ваш заказ принят в обработку</p>
          <p className="text-sm text-gray-500">Перенаправление...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Заголовок */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-8 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <CreditCard className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Оплата заказа</h1>
                <p className="text-blue-100">Безопасный платеж</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-blue-100">
              <Lock className="w-4 h-4" />
              <span className="text-sm">Защищенное соединение SSL</span>
            </div>
          </div>

          {/* Сумма оплаты */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Сумма к оплате:</span>
              <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {amount} ₽
              </span>
            </div>
          </div>

          {/* Форма оплаты */}
          <form onSubmit={handlePayment} className="p-8 space-y-6">
            <div>
              <Label htmlFor="cardNumber" className="text-gray-700 font-medium mb-2 block">
                Номер карты
              </Label>
              <div className="relative">
                <Input
                  id="cardNumber"
                  value={paymentData.cardNumber}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    cardNumber: formatCardNumber(e.target.value)
                  })}
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  required
                  className="rounded-xl pl-12 text-lg"
                />
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div>
              <Label htmlFor="cardHolder" className="text-gray-700 font-medium mb-2 block">
                Имя владельца карты
              </Label>
              <Input
                id="cardHolder"
                value={paymentData.cardHolder}
                onChange={(e) => setPaymentData({
                  ...paymentData,
                  cardHolder: e.target.value.toUpperCase()
                })}
                placeholder="IVAN IVANOV"
                required
                className="rounded-xl text-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate" className="text-gray-700 font-medium mb-2 block">
                  Срок действия
                </Label>
                <Input
                  id="expiryDate"
                  value={paymentData.expiryDate}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    expiryDate: formatExpiryDate(e.target.value)
                  })}
                  placeholder="MM/YY"
                  maxLength="5"
                  required
                  className="rounded-xl text-lg"
                />
              </div>
              <div>
                <Label htmlFor="cvv" className="text-gray-700 font-medium mb-2 block">
                  CVV
                </Label>
                <Input
                  id="cvv"
                  type="password"
                  value={paymentData.cvv}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    cvv: e.target.value.replace(/\D/g, '').slice(0, 3)
                  })}
                  placeholder="123"
                  maxLength="3"
                  required
                  className="rounded-xl text-lg"
                />
              </div>
            </div>

            {paymentStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3"
              >
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">
                  Ошибка при обработке платежа. Проверьте данные карты.
                </p>
              </motion.div>
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(createPageUrl("Cart"))}
                disabled={processing}
                className="flex-1 rounded-xl py-6"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={processing}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl py-6 text-lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Обработка...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
                    Оплатить {amount} ₽
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-gray-500">
              Нажимая "Оплатить", вы соглашаетесь с условиями обработки платежей
            </p>
          </form>
        </motion.div>

        {/* Информация о безопасности */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>🔒 Все платежи защищены по стандарту PCI DSS</p>
        </div>
      </div>
    </div>
  );
}