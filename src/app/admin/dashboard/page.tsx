
'use client';

import React from 'react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight comic-title">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido al panel de superadministrador. Desde aquí puedes gestionar el contenido del juego.
        </p>
      </div>
      
      <div className="border rounded-lg p-6 text-center">
        <p>Selecciona una opción del menú de la izquierda para empezar a gestionar el contenido.</p>
      </div>
    </div>
  );
}
