'use client';

import React, { useState } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getAuth,
  signInWithEmailAndPassword,
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

export default function AdminLoginPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    async function checkAdmin() {
      if (user) {
        const token = await user.getIdTokenResult();
        if (token.claims.superadmin) {
          router.push('/admin/dashboard'); // Redirige al dashboard de admin si ya es admin
        } else {
            // Si el usuario no es superadmin, cierra la sesión para permitir el login de admin.
            await auth.signOut();
            toast({
                variant: 'destructive',
                title: 'Acceso Denegado',
                description: 'La sesión actual no tiene permisos de superadmin. Por favor, inicie sesión con una cuenta de administrador.',
            });
        }
      }
    }
    if (!isUserLoading) {
      checkAdmin();
    }
  }, [user, isUserLoading, router, auth, toast]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const token = await userCredential.user.getIdTokenResult();

      if (token.claims.superadmin === true) {
        toast({
          title: '¡Bienvenido, Superadmin!',
          description: 'Has iniciado sesión correctamente.',
        });
        router.push('/admin/dashboard'); // Redirigir a una futura página de dashboard
      } else {
        await auth.signOut();
        toast({
          variant: 'destructive',
          title: 'Acceso Denegado',
          description: 'No tienes permisos de superadministrador.',
        });
      }
    } catch (error: any) {
       toast({
          variant: 'destructive',
          title: 'Error al iniciar sesión',
          description: 'Las credenciales son incorrectas o el usuario no existe.',
        });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="comic-title text-2xl animate-pulse">Verificando...</p>
      </div>
    );
  }

  // Si hay un usuario pero aún no se ha redirigido, se muestra la pantalla de carga para evitar un parpadeo
  if (user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="comic-title text-2xl animate-pulse">Redirigiendo...</p>
      </div>
    );
  }

  return (
    <main className="comic-login-page">
      <div className="comic-login-header">
        <h1 className="comic-login-title">Admin Login</h1>
        <p className="comic-login-subtitle">
          Acceso exclusivo para Superadmins
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="comic-card comic-card-lg">
        <div className="comic-card-header">
          <h2 className="comic-title">Panel de Administrador</h2>
        </div>

        <div className="comic-input-group">
          <label htmlFor="email" className="comic-label">Email del Admin</label>
          <input
            id="email"
            type="email"
            className="comic-input"
            placeholder="admin@boardbombers.com"
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
          {isSubmitting ? 'Verificando...' : 'Entrar como Admin'}
        </button>
      </form>
    </main>
  );
}
