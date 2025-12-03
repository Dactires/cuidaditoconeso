'use client';

import React from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  email: z.string().email({
    message: 'Por favor, introduce una dirección de correo válida.',
  }),
  password: z.string().min(6, {
    message: 'La contraseña debe tener al menos 6 caracteres.',
  }),
});

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  const auth = getAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  React.useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/lobby');
    }
  }, [user, isUserLoading, router]);
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: '¡Bienvenido de nuevo!',
        description: 'Has iniciado sesión correctamente.',
      });
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        try {
          await createUserWithEmailAndPassword(auth, values.email, values.password);
          toast({
            title: '¡Cuenta creada!',
            description: 'Hemos creado una nueva cuenta para ti.',
          });
        } catch (creationError: any) {
          toast({
            variant: 'destructive',
            title: 'Error al crear la cuenta',
            description: creationError.message,
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Error al iniciar sesión',
          description: error.message,
        });
      }
    } finally {
        setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsSubmitting(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: '¡Bienvenido!',
        description: 'Has iniciado sesión con Google.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error con Google',
        description: error.message,
      });
    } finally {
        setIsSubmitting(false);
    }
  }


  if (isUserLoading || user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="comic-title text-2xl animate-pulse">Cargando...</p>
      </div>
    );
  }

  return (
    <main className="comic-login-page">
      <div className="comic-login-header">
        <h1 className="comic-login-title">Board{"\n"}Bombers</h1>
        <p className="comic-login-subtitle">
          Un juego de estrategia, riesgo y recompensa.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="comic-card comic-card-lg">
        <div className="comic-card-header">
          <h2 className="comic-title">Iniciar sesión</h2>
        </div>

        <div className="comic-input-group">
          <label htmlFor="email" className="comic-label">Email</label>
          <input
            id="email"
            type="email"
            className="comic-input"
            placeholder="tu@email.com"
            disabled={isSubmitting}
            {...form.register('email')}
          />
           {form.formState.errors.email && (
            <p className="comic-error-text">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="comic-input-group">
          <label htmlFor="password" className="comic-label">Contraseña</label>
          <input
            id="password"
            type="password"
            className="comic-input"
            placeholder="••••••••"
            disabled={isSubmitting}
            {...form.register('password')}
          />
          {form.formState.errors.password && (
            <p className="comic-error-text">{form.formState.errors.password.message}</p>
          )}
        </div>

        <button type="submit" className="comic-btn comic-btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Entrar / Registrarse'}
        </button>

        <div style={{ height: '8px' }} />

        <button type="button" onClick={handleGoogleSignIn} className="comic-btn comic-btn-google" style={{ width: '100%' }} disabled={isSubmitting}>
          <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,36.218,44,30.561,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
          Entrar con Google
        </button>

        <p className="comic-helper-text">
          Al continuar aceptas nuestros términos y política de privacidad.
        </p>
      </form>
    </main>
  );
}
