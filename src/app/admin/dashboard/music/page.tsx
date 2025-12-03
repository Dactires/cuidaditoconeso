
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Save, Music, X } from 'lucide-react';
import { useStorage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL, getMetadata } from 'firebase/storage';
import { Progress } from '@/components/ui/progress';

function MusicUploader({ musicType }: { musicType: 'lobby' | 'battle' }) {
  const storage = useStorage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentMusicUrl, setCurrentMusicUrl] = useState<string | null>(null);
  const [currentMusicName, setCurrentMusicName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 

  const musicTitle = musicType === 'lobby' ? 'Música del Lobby' : 'Música de Batalla';
  const musicFileName = musicType === 'lobby' ? 'lobby.mp3' : 'battle.mp3';

  // Fetch current music URL on component mount
  useEffect(() => {
    if (!storage) return;
    const musicRef = ref(storage, `music/${musicFileName}`);
    getDownloadURL(musicRef)
      .then((url) => {
        setCurrentMusicUrl(url);
        getMetadata(musicRef).then(meta => setCurrentMusicName(meta.name));
      })
      .catch((error) => {
        if (error.code !== 'storage/object-not-found') {
          console.error(`Error fetching ${musicType} music:`, error);
        }
        setCurrentMusicUrl(null);
        setCurrentMusicName(null);
      });
  }, [storage, musicType, musicFileName]);

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

    const musicRef = ref(storage, `music/${musicFileName}`);

    try {
      await uploadBytes(musicRef, selectedFile);
      const downloadURL = await getDownloadURL(musicRef);

      setUploadProgress(100);
      setCurrentMusicUrl(downloadURL);
      setCurrentMusicName(selectedFile.name);
      setSelectedFile(null);

      toast({
        title: '¡Música Guardada!',
        description: `La ${musicTitle.toLowerCase()} ha sido actualizada.`,
      });
    } catch (error) {
      console.error(`Error uploading ${musicType} music:`, error);
      toast({
        variant: 'destructive',
        title: 'Error al Subir',
        description: 'Hubo un problema al guardar el archivo de música.',
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
          <Music /> {musicTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Música Actual</Label>
          {currentMusicUrl ? (
            <div className="mt-2 space-y-2">
               <p className="text-sm text-muted-foreground truncate">
                {currentMusicName}
               </p>
               <audio controls src={currentMusicUrl} className="w-full">
                Tu navegador no soporta el elemento de audio.
               </audio>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">No se ha asignado música todavía.</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`music-upload-${musicType}`}>
            {currentMusicUrl ? 'Reemplazar Música' : 'Subir Música'}
          </Label>
          <div className="flex items-center gap-2">
             <Button 
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
             >
                <Upload className="mr-2 h-4 w-4" /> Seleccionar archivo...
             </Button>
            <Input
                id={`music-upload-${musicType}`}
                ref={fileInputRef}
                type="file"
                accept="audio/mpeg, audio/wav, audio/ogg"
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

export default function AdminMusicPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight comic-title">
          Gestión de Música del Juego
        </h1>
        <p className="text-muted-foreground">
          Sube los archivos de audio para la música de fondo del lobby y de las batallas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MusicUploader musicType="lobby" />
        <MusicUploader musicType="battle" />
      </div>
    </div>
  );
}
