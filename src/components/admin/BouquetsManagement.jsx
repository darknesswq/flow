
import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Sparkles, Upload, Save, RotateCcw, Database, FileSpreadsheet, X, Download, FileDown, Image as ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function BouquetsManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const formRef = useRef(null);
  const [editingBouquet, setEditingBouquet] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showBackups, setShowBackups] = useState(false);
  const [importing, setImporting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImportPopover, setShowImportPopover] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    occasion: "просто_так",
    is_popular: false,
    stock_quantity: 0,
    size: "30x40",
    composition: []
  });
  const [newFlower, setNewFlower] = useState({ flower_name: "", quantity: "" });

  const { data: bouquets, isLoading } = useQuery({
    queryKey: ['admin-bouquets'],
    queryFn: () => base44.entities.Bouquet.list('-created_date'),
    initialData: [],
  });

  const { data: backups, isLoading: loadingBackups } = useQuery({
    queryKey: ['bouquet-backups'],
    queryFn: async () => {
      const allBackups = await base44.entities.Backup.list('-created_date');
      return allBackups.filter(b => b.type === 'bouquets');
    },
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Bouquet.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bouquets'] });
      resetForm();
      toast({ title: "Букет создан", duration: 1000 });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Bouquet.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bouquets'] });
      resetForm();
      toast({ title: "Букет обновлен", duration: 1000 });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Bouquet.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bouquets'] });
      toast({ title: "Букет удален", duration: 1000 });
    },
  });

  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const dataToBackup = bouquets.map(({ id, created_date, updated_date, created_by, ...rest }) => rest);
      const backupName = `Букеты - ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: ru })}`;
      
      return await base44.entities.Backup.create({
        name: backupName,
        type: 'bouquets',
        data: dataToBackup,
        items_count: dataToBackup.length
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bouquet-backups'] });
      toast({
        title: "Бэкап создан!",
        description: `Сохранено ${bouquets.length} букетов`,
        duration: 2000,
      });
    },
  });

  const restoreBackupMutation = useMutation({
    mutationFn: async (backup) => {
      const deletePromises = bouquets.map(bouquet => base44.entities.Bouquet.delete(bouquet.id));
      await Promise.all(deletePromises);
      
      await base44.entities.Bouquet.bulkCreate(backup.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bouquets'] });
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
      queryClient.invalidateQueries({ queryKey: ['bouquet-backups'] });
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

    if (editingBouquet) {
      updateMutation.mutate({ id: editingBouquet.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (bouquet) => {
    setEditingBouquet(bouquet);
    setFormData({
      name: bouquet.name || "",
      description: bouquet.description || "",
      price: bouquet.price || "",
      image_url: bouquet.image_url || "",
      occasion: bouquet.occasion || "просто_так",
      is_popular: bouquet.is_popular || false,
      stock_quantity: bouquet.stock_quantity || 0,
      size: bouquet.size || "30x40",
      composition: bouquet.composition || []
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
      occasion: "просто_так",
      is_popular: false,
      stock_quantity: 0,
      size: "30x40",
      composition: []
    });
    setNewFlower({ flower_name: "", quantity: "" });
    setEditingBouquet(null);
    setShowForm(false);
  };

  const addFlowerToComposition = () => {
    if (newFlower.flower_name && newFlower.quantity) {
      setFormData({
        ...formData,
        composition: [...formData.composition, { 
          flower_name: newFlower.flower_name, 
          quantity: parseInt(newFlower.quantity, 10) 
        }]
      });
      setNewFlower({ flower_name: "", quantity: "" });
    }
  };

  const removeFlowerFromComposition = (index) => {
    setFormData({
      ...formData,
      composition: formData.composition.filter((_, i) => i !== index)
    });
  };

  const downloadTemplate = () => {
    const template = [
      {
        name: "Романтический букет",
        price: 3500,
        description: "Букет из красных роз для любимых",
        image_url: "https://example.com/romantic.jpg",
        occasion: "романтика",
        is_popular: true,
        stock_quantity: 15,
        size: "35x45",
        composition: JSON.stringify([
          { flower_name: "Роза красная", quantity: 15 },
          { flower_name: "Зелень", quantity: 5 }
        ])
      }
    ];

    const headers = ["name", "price", "description", "image_url", "occasion", "is_popular", "stock_quantity", "size", "composition"];
    const csvContent = [
      headers.join(","),
      ...template.map(item => 
        headers.map(header => {
          const value = item[header];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(",")
      )
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'шаблон_букеты.csv';
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
            bouquets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  price: { type: "number" },
                  description: { type: "string" },
                  image_url: { type: "string" },
                  occasion: { type: "string" },
                  is_popular: { type: "boolean" },
                  stock_quantity: { type: "integer" },
                  size: { type: "string" },
                  composition: { type: "string" }
                },
                required: ["name", "price", "stock_quantity"] // Added stock_quantity as required
              }
            }
          }
        }
      });

      if (result.status === "success" && result.output?.bouquets) {
        const processedBouquets = result.output.bouquets.map(b => ({
          ...b,
          composition: b.composition ? JSON.parse(b.composition) : []
        }));
        await base44.entities.Bouquet.bulkCreate(processedBouquets);
        queryClient.invalidateQueries({ queryKey: ['admin-bouquets'] });
        toast({
          title: "Импорт успешен!",
          description: `Импортировано ${processedBouquets.length} букетов`,
          duration: 2000,
        });
      } else {
        throw new Error(result.details || "Ошибка импорта");
      }
    } catch (error) {
      toast({
        title: "Ошибка импорта",
        description: error.message || "Не удалось импортировать файл",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setImporting(false);
      e.target.value = "";
      setShowImportPopover(false); // Close popover after import
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Управление букетами</h2>
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
            disabled={createBackupMutation.isPending || bouquets.length === 0}
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
                    <h3 className="font-bold text-blue-900 text-sm sm:text-base">Импорт букетов</h3>
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
                    <li>Заполните данными о букетах</li>
                    <li>Сохраните файл (CSV или Excel)</li>
                    <li>Загрузите файл обратно</li>
                  </ol>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 sm:p-3">
                  <p className="text-[10px] sm:text-xs text-amber-800 font-medium mb-1">⚠️ Обязательные поля:</p>
                  <ul className="text-[10px] sm:text-xs text-amber-700 space-y-0.5">
                    <li>• <strong>name</strong> - название букета</li>
                    <li>• <strong>price</strong> - цена</li>
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
            Добавить букет
          </Button>
        </div>
      </div>

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
                        {backup.items_count} букетов • {format(new Date(backup.created_date), 'dd.MM.yyyy HH:mm', { locale: ru })}
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
              {editingBouquet ? 'Редактировать букет' : 'Новый букет'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Загрузка изображения */}
              <div className="border-2 border-dashed border-pink-200 rounded-2xl p-4 bg-gradient-to-r from-pink-50 to-purple-50">
                <Label className="text-lg font-bold text-pink-900 mb-3 block flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Изображение букета (524x524)
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="size">Размер (ШхВ см) *</Label>
                  <Input
                    id="size"
                    value={formData.size}
                    onChange={(e) => setFormData({...formData, size: e.target.value})}
                    placeholder="30x40"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Например: 30x40 или 25x35</p>
                </div>
                <div>
                  <Label htmlFor="occasion">Случай</Label>
                  <Select value={formData.occasion} onValueChange={(value) => setFormData({...formData, occasion: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="романтика">Романтика</SelectItem>
                      <SelectItem value="день_рождения">День рождения</SelectItem>
                      <SelectItem value="благодарность">Благодарность</SelectItem>
                      <SelectItem value="просто_так">Просто так</SelectItem>
                      <SelectItem value="свадьба">Свадьба</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="border-2 border-purple-200 rounded-2xl p-4 bg-gradient-to-r from-purple-50 to-pink-50">
                <Label className="text-lg font-bold text-purple-900 mb-3 block">Состав букета</Label>
                
                {formData.composition.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {formData.composition.map((flower, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-xl">
                        <span className="text-sm font-medium text-gray-900">
                          {flower.flower_name} - {flower.quantity} шт
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFlowerFromComposition(index)}
                          className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <Input
                      placeholder="Название цветка"
                      value={newFlower.flower_name}
                      onChange={(e) => setNewFlower({...newFlower, flower_name: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Кол-во"
                      min="1"
                      value={newFlower.quantity}
                      onChange={(e) => setNewFlower({...newFlower, quantity: e.target.value})}
                    />
                    <Button
                      type="button"
                      onClick={addFlowerToComposition}
                      disabled={!newFlower.flower_name || !newFlower.quantity}
                      className="bg-purple-500 hover:bg-purple-600 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200">
                <Switch
                  id="is_popular"
                  checked={formData.is_popular}
                  onCheckedChange={(checked) => setFormData({...formData, is_popular: checked})}
                  className="data-[state=checked]:bg-amber-500 shadow-md"
                />
                <Label htmlFor="is_popular" className="font-medium text-gray-900 cursor-pointer">
                  Популярный букет
                </Label>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Отмена
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white">
                  {editingBouquet ? 'Сохранить' : 'Создать'}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bouquets.map((bouquet) => {
          const stockQty = bouquet.stock_quantity ?? 0;
          const isLowStock = stockQty > 0 && stockQty < 5;
          const isOutOfStock = stockQty === 0;
          
          return (
            <div key={bouquet.id} className={`bg-white rounded-3xl shadow-lg overflow-hidden ${isOutOfStock ? 'opacity-60' : ''}`}>
              <div className="relative aspect-square bg-gradient-to-br from-pink-100 to-purple-100">
                {bouquet.image_url ? (
                  <img src={bouquet.image_url} alt={bouquet.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-pink-300" />
                  </div>
                )}
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center">
                    <span className="text-white font-bold">Нет в наличии</span>
                  </div>
                )}
                {isLowStock && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-amber-500 text-white">
                      Осталось мало
                    </Badge>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{bouquet.name}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{bouquet.description}</p>
                
                {bouquet.size && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500">Размер: <span className="font-medium text-gray-700">{bouquet.size} см</span></p>
                  </div>
                )}

                {bouquet.composition && bouquet.composition.length > 0 && (
                  <div className="mb-3 p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <p className="text-xs font-bold text-purple-900 mb-1">Состав:</p>
                    <div className="space-y-0.5">
                      {bouquet.composition.map((flower, idx) => (
                        <p key={idx} className="text-xs text-purple-700">
                          • {flower.flower_name} - {flower.quantity} шт
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <p className="text-xl font-bold text-pink-600">{bouquet.price} ₽</p>
                  <Badge className={
                    isOutOfStock ? "bg-red-100 text-red-800" :
                    isLowStock ? "bg-amber-100 text-amber-800" :
                    "bg-green-100 text-green-800"
                  }>
                    {stockQty} шт
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(bouquet)}
                    className="flex-1"
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Изменить
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(bouquet.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
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
