
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Save, Music, X, FileAudio, Bomb } from 'lucide-react';
import { useStorage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL, getMetadata } from 'firebase/storage';
import { Progress } from '@/components/ui/progress';

function AudioUploader({
  title,
  description,
  storagePath,
  icon: Icon,
  accept,
}: {
  title: string;
  description: string;
  storagePath: string;
  icon: React.ElementType;
  accept: string;
}) {
  const storage = useStorage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [currentName, setCurrentName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 

  // Fetch current audio URL on component mount
  useEffect(() => {
    if (!storage) return;
    const audioRef = ref(storage, storagePath);
    getDownloadURL(audioRef)
      .then((url) => {
        setCurrentUrl(url);
        getMetadata(audioRef).then(meta => setCurrentName(meta.name));
      })
      .catch((error) => {
        if (error.code !== 'storage/object-not-found') {
          console.error(`Error fetching ${title} audio:`, error);
        }
        setCurrentUrl(null);
        setCurrentName(null);
      });
  }, [storage, title, storagePath]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSaveMusic = async () => {
    if (!storage || !selectedFile) return;

    setIsUploading(true);
    setUploadProgress(50); 

    const audioRef = ref(storage, storagePath);

    try {
      await uploadBytes(audioRef, selectedFile);
      const downloadURL = await getDownloadURL(audioRef);

      setUploadProgress(100);
      setCurrentUrl(downloadURL);
      setCurrentName(selectedFile.name);
      setSelectedFile(null);

      toast({
        title: '¡Audio Guardado!',
        description: `El archivo de ${title.toLowerCase()} ha sido actualizado.`,
      });
    } catch (error) {
      console.error(`Error uploading ${title} audio:`, error);
      toast({
        variant: 'destructive',
        title: 'Error al Subir',
        description: 'Hubo un problema al guardar el archivo de audio.',
      });
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="comic-title text-lg flex items-center gap-2">
          <Icon /> {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Audio Actual</Label>
          {currentUrl ? (
            <div className="mt-2 space-y-2">
               <p className="text-sm text-muted-foreground truncate">
                {currentName}
               </p>
               <audio controls src={currentUrl} className="w-full">
                Tu navegador no soporta el elemento de audio.
               </audio>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">No se ha asignado audio todavía.</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`music-upload-${title}`}>
            {currentUrl ? 'Reemplazar Audio' : 'Subir Audio'}
          </Label>
          <div className="flex items-center gap-2">
             <Button 
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
             >
                <Upload className="mr-2 h-4 w-4" /> Seleccionar archivo...
             </Button>
            <Input
                id={`music-upload-${title}`}
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
            />
          </div>

            {selectedFile && (
                <div className="border rounded-md p-2 flex items-center gap-2 text-sm bg-muted/50">
                    <Music className="h-4 w-4 text-muted-foreground" />
                    <p className="flex-grow truncate font-medium">{selectedFile.name}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
        
        {isUploading && (
            <div className="space-y-1">
                <Progress value={uploadProgress} className="w-full"/>
                <p className="text-xs text-muted-foreground animate-pulse">Subiendo archivo...</p>
            </div>
        )}

        <Button
          className="w-full comic-btn comic-btn-primary"
          onClick={handleSaveMusic}
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? 'Guardando...' : <><Save className="mr-2 h-4 w-4" /> Guardar Cambios</>}
        </Button>
      </CardContent>
    </Card>
  );
}


export default function AdminAudioPage() {
  const audioFiles = [
    {
      title: "Música del Lobby",
      description: "Música de fondo para la pantalla principal.",
      storagePath: "music/lobby.mp3",
      icon: Music,
      accept: "audio/mpeg"
    },
    {
      title: "Música de Batalla",
      description: "Música de fondo durante las partidas.",
      storagePath: "music/battle.mp3",
      icon: Music,
      accept: "audio/mpeg"
    },
    {
      title: "SFX: Explosión",
      description: "Sonido al explotar una carta de bomba.",
      storagePath: "sfx/explosion.mp3",
      icon: Bomb,
      accept: "audio/mpeg, audio/wav, audio/ogg"
    },
    {
      title: "SFX: Voltear Carta",
      description: "Sonido al revelar una carta en el tablero.",
      storagePath: "sfx/flip.mp3",
      icon: FileAudio,
      accept: "audio/mpeg, audio/wav, audio/ogg"
    },
    {
      title: "SFX: Robar Carta",
      description: "Sonido cuando un jugador roba una carta.",
      storagePath: "sfx/draw.mp3",
      icon: FileAudio,
      accept: "audio/mpeg, audio/wav, audio/ogg"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight comic-title">
          Gestión de Audio del Juego
        </h1>
        <p className="text-muted-foreground">
          Sube los archivos para la música de fondo y los efectos de sonido (SFX).
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="comic-title text-xl">Música de Fondo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {audioFiles.filter(f => f.storagePath.startsWith('music/')).map(file => (
            <AudioUploader key={file.storagePath} {...file} />
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <h2 className="comic-title text-xl">Efectos de Sonido (SFX)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {audioFiles.filter(f => f.storagePath.startsWith('sfx/')).map(file => (
            <AudioUploader key={file.storagePath} {...file} />
          ))}
        </div>
      </div>
    </div>
  );
}
