'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { useState }from 'react';
import { motion } from 'framer-motion';

const formSchema = z.object({
  email: z.string().email({
    message: 'Por favor, introduce una dirección de correo válida.',
  }),
  password: z.string().min(6, {
    message: 'La contraseña debe tener al menos 6 caracteres.',
  }),
});

export default function LoginForm() {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="comic-panel p-8"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white font-display tracking-wider">Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="tu@email.com" 
                    {...field}
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:ring-accent"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white font-display tracking-wider">Contraseña</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="••••••" 
                    {...field}
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:ring-accent"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button 
            type="submit" 
            className="w-full font-display tracking-widest text-lg bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_4px_0_#b45309] active:shadow-none active:translate-y-1 transition-all"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Entrando...' : 'Entrar / Registrarse'}
          </Button>
        </form>
      </Form>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-600" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-sky-400/40 px-2 text-slate-300 font-display">O</span>
        </div>
      </div>
      <Button
        variant="outline"
        className="w-full font-display tracking-wider text-lg bg-white text-black hover:bg-slate-200 border-2 border-black shadow-[0_4px_0_#444] active:shadow-none active:translate-y-1 transition-all"
        onClick={handleGoogleSignIn}
        disabled={isSubmitting}
      >
        <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,36.218,44,30.561,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
        Entrar con Google
      </Button>
    </motion.div>
  );
}
