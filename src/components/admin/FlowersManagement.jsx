
import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Flower2, Upload, Save, RotateCcw, Database, Download, FileSpreadsheet, FileDown, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function FlowersManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const formRef = useRef(null);
  const [editingFlower, setEditingFlower] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showBackups, setShowBackups] = useState(false);
  const [importing, setImporting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false); // New state for image upload
  const [showImportPopover, setShowImportPopover] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    color: "красный",
    category: "розы",
    in_stock: true,
    stock_quantity: 0
  });

  const { data: flowers, isLoading } = useQuery({
    queryKey: ['admin-flowers'],
    queryFn: () => base44.entities.Flower.list('-created_date'),
    initialData: [],
  });

  const { data: backups, isLoading: loadingBackups } = useQuery({
    queryKey: ['flower-backups'],
    queryFn: async () => {
      const allBackups = await base44.entities.Backup.list('-created_date');
      return allBackups.filter(b => b.type === 'flowers');
    },
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Flower.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flowers'] });
      resetForm();
      toast({ title: "Цветок создан", duration: 1000 });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Flower.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flowers'] });
      resetForm();
      toast({ title: "Цветок обновлен", duration: 1000 });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Flower.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flowers'] });
      toast({ title: "Цветок удален", duration: 1000 });
    },
  });

  const createBackupMutation = useMutation({
    mutationFn: async () => {
      // Ensure all relevant fields are backed up, including stock_quantity
      const dataToBackup = flowers.map(({ id, created_date, updated_date, created_by, ...rest }) => ({
        ...rest,
        // Explicitly include stock_quantity in case it's not present in 'rest' for older entries
        stock_quantity: rest.stock_quantity !== undefined ? rest.stock_quantity : 0
      }));
      const backupName = `Цветы - ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: ru })}`;
      
      return await base44.entities.Backup.create({
        name: backupName,
        type: 'flowers',
        data: dataToBackup,
        items_count: dataToBackup.length
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flower-backups'] });
      toast({
        title: "Бэкап создан!",
        description: `Сохранено ${flowers.length} цветов`,
        duration: 2000,
      });
    },
  });

  const restoreBackupMutation = useMutation({
    mutationFn: async (backup) => {
      // Удалить все текущие цветы
      const deletePromises = flowers.map(flower => base44.entities.Flower.delete(flower.id));
      await Promise.all(deletePromises);
      
      // Восстановить из бэкапа
      await base44.entities.Flower.bulkCreate(backup.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flowers'] });
      toast({
        title: "Восстановление завершено!",
        description: "Данные успешно восстановлены из бэкапа",
        duration: 2000,
      });
    },
  });

  const deleteBackupMutation = useMutation({
    mutationFn: (id) => base44.entities.Backup.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flower-backups'] });
      toast({ title: "Бэкап удален", duration: 1000 });
    },
  });

  /**
   * Изменяет размер изображения до 524x524 пикселей
   * Сохраняет пропорции, обрезая лишнее
   */
  const resizeImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          // Создаем canvas с нужным размером
          const canvas = document.createElement('canvas');
          const targetSize = 524;
          canvas.width = targetSize;
          canvas.height = targetSize;
          
          const ctx = canvas.getContext('2d');
          
          // Вычисляем размеры для crop (чтобы получить квадрат)
          const sourceSize = Math.min(img.width, img.height);
          const sourceX = (img.width - sourceSize) / 2;
          const sourceY = (img.height - sourceSize) / 2;
          
          // Рисуем изображение с обрезкой до квадрата и масштабированием
          ctx.drawImage(
            img,
            sourceX, sourceY, sourceSize, sourceSize, // source (квадрат из центра)
            0, 0, targetSize, targetSize              // destination (524x524)
          );
          
          // Конвертируем canvas в blob
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Не удалось обработать изображение'));
            }
          }, file.type || 'image/jpeg', 0.9); // Качество 90%
        };
        
        img.onerror = () => reject(new Error('Не удалось загрузить изображение'));
        img.src = e.target.result;
      };
      
      reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите изображение",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    // Проверка размера файла (макс 10MB для исходного)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Ошибка",
        description: "Размер изображения не должен превышать 10MB",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    setUploadingImage(true);
    try {
      // Изменяем размер изображения до 524x524
      const resizedBlob = await resizeImage(file);
      
      // Создаем File объект из blob
      const resizedFile = new File([resizedBlob], file.name, { type: file.type });
      
      // Загружаем обработанное изображение
      const { file_url } = await base44.integrations.Core.UploadFile({ file: resizedFile });
      setFormData({ ...formData, image_url: file_url });
      
      toast({
        title: "Изображение загружено!",
        description: "Картинка адаптирована под размер 524x524",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Ошибка загрузки",
        description: error.message || "Не удалось загрузить изображение",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity, 10)
    };

    if (editingFlower) {
      updateMutation.mutate({ id: editingFlower.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (flower) => {
    setEditingFlower(flower);
    setFormData({
      name: flower.name || "",
      description: flower.description || "",
      price: flower.price || "",
      image_url: flower.image_url || "",
      color: flower.color || "красный",
      category: flower.category || "розы",
      in_stock: flower.in_stock !== undefined ? flower.in_stock : true,
      stock_quantity: flower.stock_quantity !== undefined ? flower.stock_quantity : 0
    });
    setShowForm(true);
    
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      image_url: "",
      color: "красный",
      category: "розы",
      in_stock: true,
      stock_quantity: 0
    });
    setEditingFlower(null);
    setShowForm(false);
  };

  const downloadTemplate = () => {
    const template = [
      {
        name: "Красная роза",
        price: 150,
        description: "Классическая красная роза",
        image_url: "https://example.com/rose.jpg",
        color: "красный",
        category: "розы",
        in_stock: true,
        stock_quantity: 50
      },
      {
        name: "Белая лилия",
        price: 200,
        description: "Элегантная белая лилия",
        image_url: "https://example.com/lily.jpg",
        color: "белый",
        category: "лилии",
        in_stock: true,
        stock_quantity: 30
      },
      {
        name: "Желтый тюльпан",
        price: 120,
        description: "Яркий желтый тюльпан",
        image_url: "https://example.com/tulip.jpg",
        color: "желтый",
        category: "тюльпаны",
        in_stock: true,
        stock_quantity: 100
      }
    ];

    // Создаем CSV контент
    const headers = ["name", "price", "description", "image_url", "color", "category", "in_stock", "stock_quantity"];
    const csvContent = [
      headers.join(","),
      ...template.map(item => 
        headers.map(header => {
          const value = item[header];
          // Экранируем значения с запятыми и кавычками
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(",")
      )
    ].join("\n");

    // Добавляем BOM для корректного отображения кириллицы в Excel
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'шаблон_цветы.csv';
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Шаблон скачан!",
      description: "Заполните шаблон и импортируйте обратно",
      duration: 2000,
    });
    setShowImportPopover(false);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            flowers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  price: { type: "number" },
                  description: { type: "string" },
                  image_url: { type: "string" },
                  color: { type: "string" },
                  category: { type: "string" },
                  in_stock: { type: "boolean" },
                  stock_quantity: { type: "number" }
                }
              }
            }
          }
        }
      });

      if (result.status === "success" && result.output?.flowers) {
        await base44.entities.Flower.bulkCreate(result.output.flowers);
        queryClient.invalidateQueries({ queryKey: ['admin-flowers'] });
        toast({
          title: "Импорт успешен!",
          description: `Импортировано ${result.output.flowers.length} цветов`,
          duration: 2000,
        });
        setShowImportPopover(false);
      } else {
        throw new Error(result.details || "Ошибка импорта");
      }
    } catch (error) {
      toast({
        title: "Ошибка импорта",
        description: error.message || "Не удалось импортировать файл",
        duration: 3000,
      });
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Управление цветами</h2>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setShowBackups(!showBackups)}
            className="rounded-full border-purple-300 hover:bg-purple-50"
          >
            <Database className="w-4 h-4 mr-2" />
            Бэкапы ({backups.length})
          </Button>
          <Button
            variant="outline"
            onClick={() => createBackupMutation.mutate()}
            disabled={createBackupMutation.isPending || flowers.length === 0}
            className="rounded-full border-green-300 hover:bg-green-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {createBackupMutation.isPending ? "Создание..." : "Создать бэкап"}
          </Button>
          
          <Popover open={showImportPopover} onOpenChange={setShowImportPopover}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="rounded-full border-blue-300 hover:bg-blue-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                Импорт товаров
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] sm:w-96 p-0" align="end" sideOffset={5}>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 border-b">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900 text-sm sm:text-base">Импорт цветов</h3>
                    <p className="text-[10px] sm:text-xs text-blue-700">Массовое добавление</p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                <div>
                  <p className="font-medium text-gray-900 mb-2 text-xs sm:text-sm">📋 Инструкция:</p>
                  <ol className="text-[10px] sm:text-xs text-gray-700 space-y-1 sm:space-y-1.5 list-decimal list-inside">
                    <li>Скачайте шаблон CSV с примерами</li>
                    <li>Откройте файл в Excel или Google Sheets</li>
                    <li>Заполните данными о цветах</li>
                    <li>Сохраните файл (CSV или Excel)</li>
                    <li>Загрузите файл обратно</li>
                  </ol>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 sm:p-3">
                  <p className="text-[10px] sm:text-xs text-amber-800 font-medium mb-1">⚠️ Обязательные поля:</p>
                  <ul className="text-[10px] sm:text-xs text-amber-700 space-y-0.5">
                    <li>• <strong>name</strong> - название цветка</li>
                    <li>• <strong>price</strong> - цена</li>
                    <li>• <strong>color</strong> - цвет</li>
                    <li>• <strong>category</strong> - категория</li>
                    <li>• <strong>stock_quantity</strong> - количество</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={downloadTemplate}
                    variant="outline"
                    className="w-full justify-start border-green-300 hover:bg-green-50 h-9 sm:h-10 text-xs sm:text-sm"
                  >
                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 text-green-600 flex-shrink-0" />
                    <span>Скачать шаблон</span>
                  </Button>

                  <label className="block">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleImport}
                      className="hidden"
                      disabled={importing}
                    />
                    <Button
                      as="span"
                      disabled={importing}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white h-9 sm:h-10 text-xs sm:text-sm"
                    >
                      <FileDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                      {importing ? "Импортирую..." : "Загрузить файл"}
                    </Button>
                  </label>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить цветок
          </Button>
        </div>
      </div>

      {/* Список бэкапов */}
      <AnimatePresence>
        {showBackups && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-3xl shadow-lg p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Сохраненные бэкапы</h3>
            {loadingBackups ? (
              <p className="text-gray-500">Загрузка...</p>
            ) : backups.length === 0 ? (
              <p className="text-gray-500">Бэкапов пока нет</p>
            ) : (
              <div className="space-y-3">
                {backups.map((backup) => (
                  <div key={backup.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{backup.name}</p>
                      <p className="text-sm text-gray-600">
                        {backup.items_count} цветов • {format(new Date(backup.created_date), 'dd.MM.yyyy HH:mm', { locale: ru })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (window.confirm(`Восстановить данные из бэкапа "${backup.name}"? Текущие данные будут удалены.`)) {
                            restoreBackupMutation.mutate(backup);
                          }
                        }}
                        disabled={restoreBackupMutation.isPending}
                        className="rounded-full"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Восстановить
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteBackupMutation.mutate(backup.id)}
                        className="text-red-500 hover:text-red-700 rounded-full"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <motion.div
            ref={formRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-3xl shadow-lg p-6 scroll-mt-8"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingFlower ? 'Редактировать цветок' : 'Новый цветок'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Загрузка изображения */}
              <div className="border-2 border-dashed border-pink-200 rounded-2xl p-4 bg-gradient-to-r from-pink-50 to-purple-50">
                <Label className="text-lg font-bold text-pink-900 mb-3 block flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Изображение цветка (524x524)
                </Label>
                
                {formData.image_url ? (
                  <div className="space-y-3">
                    <div className="relative w-full aspect-square max-w-xs mx-auto bg-gray-100 rounded-xl overflow-hidden">
                      <img 
                        src={formData.image_url} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex gap-2">
                      <label className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          disabled={uploadingImage}
                          as="span"
                        >
                          {uploadingImage ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Обработка...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Заменить
                            </>
                          )}
                        </Button>
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setFormData({ ...formData, image_url: "" })}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Удалить
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    <div className="flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-pink-100 transition-colors rounded-xl">
                      {uploadingImage ? (
                        <>
                          <Loader2 className="w-12 h-12 text-pink-400 mb-3 animate-spin" />
                          <p className="text-sm text-pink-700 font-medium">Обработка изображения...</p>
                          <p className="text-xs text-pink-600 mt-1">Адаптация до 524x524</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-pink-400 mb-3" />
                          <p className="text-sm text-pink-700 font-medium mb-1">Нажмите для загрузки</p>
                          <p className="text-xs text-pink-600">Автоматически адаптируется до 524x524</p>
                          <p className="text-xs text-pink-500 mt-1">PNG, JPG, WEBP до 10MB</p>
                        </>
                      )}
                    </div>
                  </label>
                )}
                
                <div className="mt-3">
                  <Label htmlFor="image_url_manual" className="text-xs text-gray-600">или введите URL:</Label>
                  <Input
                    id="image_url_manual"
                    value={formData.image_url}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    placeholder="https://example.com/image.jpg"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="name">Название *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Цена *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="stock_quantity">Количество на складе *</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                    required
                    className="font-bold"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="color">Цвет</Label>
                  <Select value={formData.color} onValueChange={(value) => setFormData({...formData, color: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="красный">Красный</SelectItem>
                      <SelectItem value="розовый">Розовый</SelectItem>
                      <SelectItem value="белый">Белый</SelectItem>
                      <SelectItem value="желтый">Желтый</SelectItem>
                      <SelectItem value="оранжевый">Оранжевый</SelectItem>
                      <SelectItem value="фиолетовый">Фиолетовый</SelectItem>
                      <SelectItem value="синий">Синий</SelectItem>
                      <SelectItem value="микс">Микс</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Категория</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="розы">Розы</SelectItem>
                      <SelectItem value="тюльпаны">Тюльпаны</SelectItem>
                      <SelectItem value="лилии">Лилии</SelectItem>
                      <SelectItem value="хризантемы">Хризантемы</SelectItem>
                      <SelectItem value="пионы">Пионы</SelectItem>
                      <SelectItem value="орхидеи">Орхидеи</SelectItem>
                      <SelectItem value="эустома">Эустома</SelectItem>
                      <SelectItem value="альстромерия">Альстромерия</SelectItem>
                      <SelectItem value="гвоздики">Гвоздики</SelectItem>
                      <SelectItem value="зелень">Зелень</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                <Switch
                  id="in_stock"
                  checked={formData.in_stock}
                  onCheckedChange={(checked) => setFormData({...formData, in_stock: checked})}
                  className="data-[state=checked]:bg-green-500 shadow-md"
                />
                <Label htmlFor="in_stock" className="font-medium text-gray-900 cursor-pointer">
                  Доступен для продажи
                </Label>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Отмена
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white">
                  {editingFlower ? 'Сохранить' : 'Создать'}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {flowers.map((flower) => {
          const stockQty = flower.stock_quantity !== undefined ? flower.stock_quantity : 0;
          const isLowStock = stockQty < 10 && stockQty > 0;
          const isOutOfStock = stockQty === 0;
          
          return (
            <div key={flower.id} className={`bg-white rounded-2xl shadow-lg overflow-hidden ${isOutOfStock ? 'opacity-60' : ''}`}>
              <div className="relative aspect-square bg-gradient-to-br from-pink-100 to-purple-100">
                {flower.image_url ? (
                  <img src={flower.image_url} alt={flower.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Flower2 className="w-10 h-10 text-pink-300" />
                  </div>
                )}
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">Нет в наличии</span>
                  </div>
                )}
                {isLowStock && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-amber-500 text-white">
                      Мало
                    </Badge>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-bold text-sm text-gray-900 mb-1">{flower.name}</h3>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-base font-bold text-pink-600">{flower.price} ₽</p>
                  <Badge className={
                    isOutOfStock ? "bg-red-100 text-red-800" :
                    isLowStock ? "bg-amber-100 text-amber-800" :
                    "bg-green-100 text-green-800"
                  }>
                    {stockQty} шт
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(flower)}
                    className="flex-1 text-xs"
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(flower.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
