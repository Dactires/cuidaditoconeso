
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { CARD_DEFINITIONS, GameCardDef } from '@/lib/card-definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';

// Componente para una sola tarjeta
function AdminCard({ card }: { card: GameCardDef }) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storage = getStorage();
  const firestore = getFirestore();

  useEffect(() => {
    // Cargar la imagen actual de la carta desde Firestore
    const fetchImage = async () => {
        const docRef = doc(firestore, 'card-images', card.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            setCurrentImageUrl(docSnap.data().imageUrl);
        }
    };
    fetchImage();
  }, [card.id, firestore]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor, selecciona un archivo de imagen.',
      });
      return;
    }

    setIsUploading(true);
    const storageRef = ref(storage, `card-images/${card.id}/${selectedFile.name}`);

    try {
      // Subir archivo a Firebase Storage
      const snapshot = await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Guardar URL en Firestore
      const docRef = doc(firestore, 'card-images', card.id);
      await setDoc(docRef, { imageUrl: downloadURL }, { merge: true });

      setCurrentImageUrl(downloadURL);
      setSelectedFile(null);
      setImagePreview(null);
      
      toast({
        title: '¡Éxito!',
        description: `Imagen para "${card.label}" actualizada.`,
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        variant: 'destructive',
        title: 'Error de subida',
        description: 'Hubo un problema al subir la imagen. Revisa la consola.',
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const finalImageUrl = imagePreview || currentImageUrl;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="comic-title text-lg flex items-center justify-between">
          {card.label}
          <span className="font-mono text-xs px-2 py-1 bg-muted rounded-full">{card.id}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vista previa de la carta */}
            <div className={cn("relative w-full aspect-square rounded-lg border-2 border-dashed flex items-center justify-center", finalImageUrl && "border-solid")}>
                {finalImageUrl ? (
                    <Image src={finalImageUrl} alt={`Imagen de ${card.label}`} layout="fill" objectFit="cover" className="rounded-lg" />
                ) : (
                    <span className="text-sm text-muted-foreground">Sin imagen</span>
                )}
            </div>

            {/* Formulario de subida */}
            <div className="space-y-3">
                <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                />
                
                {!selectedFile && (
                    <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                        Seleccionar Imagen
                    </Button>
                )}
                
                {selectedFile && (
                    <div className="space-y-2">
                         <div className="border rounded-md p-2 flex items-center gap-2">
                            <Image src={imagePreview!} alt="Previsualización" width={40} height={40} className="rounded" />
                            <div className="flex-grow text-xs truncate">
                                <p className="font-semibold">{selectedFile.name}</p>
                                <p className="text-muted-foreground">{Math.round(selectedFile.size / 1024)} KB</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedFile(null); setImagePreview(null); }}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button className="w-full" onClick={handleUpload} disabled={isUploading}>
                            {isUploading ? "Subiendo..." : <> <Upload className="mr-2 h-4 w-4" /> Subir y Guardar </>}
                        </Button>
                    </div>
                )}
                <p className="text-xs text-muted-foreground">
                    Sube una imagen cuadrada (ej: 512x512) para la carta. Formatos aceptados: PNG, JPG, WEBP.
                </p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente principal de la página
export default function AdminCardsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight comic-title">
          Gestión de Cartas
        </h1>
        <p className="text-muted-foreground">
          Aquí puedes ver todas las cartas del juego y asignarles una imagen.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {CARD_DEFINITIONS.map((card) => (
          <AdminCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
