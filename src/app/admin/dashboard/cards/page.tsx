
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { CARD_DEFINITIONS, GameCardDef } from '@/lib/card-definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Save, BrainCircuit, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, setDoc, getDoc, DocumentData } from 'firebase/firestore';
import { useFirebase } from '@/firebase';

function AdminCard({ initialCard }: { initialCard: GameCardDef }) {
  const { toast } = useToast();
  const { firestore, storage } = useFirebase();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [card, setCard] = useState<GameCardDef>(initialCard);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [soundPreview, setSoundPreview] = useState<string | null>(null);
  const [selectedSoundFile, setSelectedSoundFile] = useState<File | null>(null);
  const soundInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCardData = async () => {
      if (!firestore) return;
      const docRef = doc(firestore, 'card-images', initialCard.id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const firestoreData = docSnap.data();
        setCard(prevCard => ({
          ...prevCard,
          ...firestoreData,
          ability: {
            name: firestoreData.ability?.name || '',
            description: firestoreData.ability?.description || '',
            json: firestoreData.ability?.json || '{}',
            soundUrl: firestoreData.ability?.soundUrl || '',
          }
        }));
      }
    };
    fetchCardData();
  }, [initialCard, firestore]);

  const handleInputChange = (field: keyof GameCardDef, value: string) => {
    setCard(prev => ({ ...prev, [field]: value }));
  };
  
  const handleAbilityChange = (field: 'name' | 'description' | 'json', value: string) => {
    setCard(prev => ({
      ...prev,
      ability: {
        ...prev.ability,
        name: field === 'name' ? value : prev.ability?.name || '',
        description: field === 'description' ? value : prev.ability?.description || '',
        json: field === 'json' ? value : prev.ability?.json || '{}',
      }
    }));
  };

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
  
  const handleSoundFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedSoundFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
          setSoundPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  const handleSaveAll = async () => {
    if (!firestore || !storage) return;
    setIsSaving(true);
    let downloadURL = card.imageUrl;
    let soundDownloadURL = card.ability?.soundUrl;

    try {
      setIsUploading(true);
      if (selectedFile) {
        const storageRef = ref(storage, `card-images/${card.id}/image_${selectedFile.name}`);
        const snapshot = await uploadBytes(storageRef, selectedFile);
        downloadURL = await getDownloadURL(snapshot.ref);
        setCard(prev => ({...prev, imageUrl: downloadURL}));
      }
      
      if (selectedSoundFile) {
        const soundStorageRef = ref(storage, `card-sounds/${card.id}/sound_${selectedSoundFile.name}`);
        const soundSnapshot = await uploadBytes(soundStorageRef, selectedSoundFile);
        soundDownloadURL = await getDownloadURL(soundSnapshot.ref);
         setCard(prev => ({
            ...prev,
            ability: { ...prev.ability!, soundUrl: soundDownloadURL },
        }));
      }
      setIsUploading(false);
      
      const docRef = doc(firestore, 'card-images', card.id);
      
      const dataToSave: Partial<GameCardDef> = {
        label: card.label,
        description: card.description,
        imageUrl: downloadURL,
        ability: {
          name: card.ability?.name || '',
          description: card.ability?.description || '',
          json: card.ability?.json || '{}',
          soundUrl: soundDownloadURL,
        }
      };

      await setDoc(docRef, dataToSave, { merge: true });
      
      setSelectedFile(null);
      setImagePreview(null);
      setSelectedSoundFile(null);
      setSoundPreview(null);

      toast({
        title: '¡Guardado!',
        description: `Los datos de "${card.label}" se han actualizado.`,
      });

    } catch (error) {
      console.error('Error saving card data:', error);
      toast({
        variant: 'destructive',
        title: 'Error al Guardar',
        description: 'Hubo un problema al guardar los datos. Revisa la consola.',
      });
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  const finalImageUrl = imagePreview || card.imageUrl;
  
  const isJsonValid = () => {
    try {
        JSON.parse(card.ability?.json || '{}');
        return true;
    } catch {
        return false;
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="comic-title text-lg flex items-center justify-between">
          {initialCard.label}
          <span className="font-mono text-xs px-2 py-1 bg-muted rounded-full">
            {card.id}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Columna Izquierda: Imagen y subida */}
          <div className="space-y-4">
            <div
              className={cn(
                'relative w-full aspect-square rounded-lg border-2 border-dashed flex items-center justify-center',
                finalImageUrl && 'border-solid'
              )}
            >
              {finalImageUrl ? (
                <Image
                  src={finalImageUrl}
                  alt={`Imagen de ${card.label}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  priority
                  className="rounded-lg object-cover"
                />
              ) : (
                <span className="text-sm text-muted-foreground">Sin imagen</span>
              )}
            </div>
             <Input
                ref={imageInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
               {!selectedFile && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => imageInputRef.current?.click()}
                >
                  Cambiar Imagen
                </Button>
              )}

              {selectedFile && imagePreview && (
                <div className="border rounded-md p-2 flex items-center gap-2">
                    <Image
                      src={imagePreview}
                      alt="Previsualización"
                      width={40}
                      height={40}
                      className="rounded"
                    />
                    <div className="flex-grow text-xs truncate">
                      <p className="font-semibold">{selectedFile.name}</p>
                      <p className="text-muted-foreground">
                        {Math.round(selectedFile.size / 1024)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setSelectedFile(null);
                        setImagePreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
              )}
          </div>

          {/* Columna Derecha: Campos de Texto */}
          <div className="space-y-3">
             <div>
                <Label htmlFor={`label-${card.id}`}>Nombre de la Carta</Label>
                <Input 
                  id={`label-${card.id}`} 
                  value={card.label} 
                  onChange={(e) => handleInputChange('label', e.target.value)} 
                />
             </div>
             <div>
                <Label htmlFor={`description-${card.id}`}>Descripción</Label>
                <Textarea 
                  id={`description-${card.id}`} 
                  value={card.description} 
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
             </div>
          </div>
        </div>

        {/* Sección de Habilidad */}
        <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-accent"/>
                <h3 className="text-lg font-bold tracking-tight comic-title">Habilidad</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor={`ability-name-${card.id}`}>Nombre de la Habilidad</Label>
                    <Input 
                      id={`ability-name-${card.id}`} 
                      value={card.ability?.name || ''} 
                      onChange={(e) => handleAbilityChange('name', e.target.value)} 
                      placeholder="Ej: Golpe Veloz"
                    />
                 </div>
                  <div>
                    <Label htmlFor={`ability-desc-${card.id}`}>Descripción de la Habilidad</Label>
                    <Textarea 
                      id={`ability-desc-${card.id}`} 
                      value={card.ability?.description || ''} 
                      onChange={(e) => handleAbilityChange('description', e.target.value)}
                      placeholder="Ej: Ataca dos veces si..."
                      rows={3}
                    />
                 </div>
            </div>
            <div>
              <Label htmlFor={`ability-json-${card.id}`}>JSON de la Habilidad</Label>
              <Textarea 
                id={`ability-json-${card.id}`}
                value={card.ability?.json || ''}
                onChange={(e) => handleAbilityChange('json', e.target.value)}
                placeholder='{ "trigger": "ON_PLAY", "action": "DRAW_CARD", "params": { "amount": 1 } }'
                rows={6}
                className={cn(
                    "font-mono text-xs",
                    !isJsonValid() && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {!isJsonValid() && (
                  <p className="text-xs text-red-500 mt-1">El JSON no es válido.</p>
              )}
            </div>
             {/* Sound Upload */}
            <div className="space-y-2">
                <Label htmlFor={`ability-sound-${card.id}`}>Audio de Habilidad</Label>
                 <Input
                    ref={soundInputRef}
                    type="file"
                    accept="audio/mpeg, audio/wav, audio/ogg"
                    onChange={handleSoundFileChange}
                    className="hidden"
                />
                {!selectedSoundFile && !card.ability?.soundUrl && (
                     <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => soundInputRef.current?.click()}
                        >
                        <Upload className="mr-2 h-4 w-4" /> Subir Audio
                    </Button>
                )}
                {selectedSoundFile && soundPreview && (
                    <div className="border rounded-md p-2 flex items-center gap-2">
                        <Music className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-grow text-xs truncate">
                            <p className="font-semibold">{selectedSoundFile.name}</p>
                            <p className="text-muted-foreground">
                                {Math.round(selectedSoundFile.size / 1024)} KB
                            </p>
                        </div>
                        <audio src={soundPreview} controls className="h-8" />
                        <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => { setSelectedSoundFile(null); setSoundPreview(null); }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                {!selectedSoundFile && card.ability?.soundUrl && (
                     <div className="border rounded-md p-2 flex items-center gap-2">
                         <Music className="h-5 w-5 text-muted-foreground" />
                         <audio src={card.ability.soundUrl} controls className="h-8 flex-grow" />
                         <Button
                            variant="outline" size="sm"
                            onClick={() => soundInputRef.current?.click()}
                         >
                            Reemplazar
                         </Button>
                     </div>
                )}
            </div>
        </div>
        
        <div className="pt-4 border-t">
          <Button
            className="w-full comic-btn comic-btn-primary"
            onClick={handleSaveAll}
            disabled={isSaving || isUploading || !isJsonValid()}
          >
            {isSaving || isUploading ? 'Guardando...' : <> <Save className="mr-2 h-4 w-4" /> Guardar Cambios </>}
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}

export default function AdminCardsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight comic-title">
          Gestión de Cartas
        </h1>
        <p className="text-muted-foreground">
          Aquí puedes ver todas las cartas del juego, asignarles una imagen y definir sus habilidades.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {CARD_DEFINITIONS.map((card) => (
          <AdminCard key={card.id} initialCard={card} />
        ))}
      </div>
    </div>
  );
}
