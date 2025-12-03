
// src/lib/setup-cors.ts

import { exec } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Lee la configuración de Firebase para obtener el bucket de almacenamiento
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../firebase/config.json'), 'utf8'));
const bucket = firebaseConfig.storageBucket;

if (!bucket) {
  console.error("No se encontró 'storageBucket' en la configuración de Firebase.");
  process.exit(1);
}

// Define la configuración CORS
const corsConfig = [
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "responseHeader": [
      "Content-Type",
      "Access-Control-Allow-Origin"
    ],
    "maxAgeSeconds": 3600
  }
];

// Crea un archivo temporal con la configuración CORS
const tempCorsFile = path.join(os.tmpdir(), 'cors.json');
fs.writeFileSync(tempCorsFile, JSON.stringify(corsConfig));

// Construye y ejecuta el comando gsutil
const command = `gsutil cors set ${tempCorsFile} gs://${bucket}`;

console.log(`Ejecutando comando: ${command}`);

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error al configurar CORS: ${stderr}`);
    return;
  }
  console.log(`Configuración de CORS aplicada exitosamente a ${bucket}:\n${stdout}`);
  
  // Limpia el archivo temporal
  fs.unlinkSync(tempCorsFile);
});
