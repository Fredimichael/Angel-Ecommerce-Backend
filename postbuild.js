const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const configDir = path.join(distDir, 'config');
const srcConfigFile = path.join(__dirname, 'config', 'river-blade-429300-d8-d9b60ef9f3da.json');
const destConfigFile = path.join(configDir, 'river-blade-429300-d8-d9b60ef9f3da.json');

// Verificar si el archivo de configuración existe
if (!fs.existsSync(srcConfigFile)) {
  console.error(`El archivo de configuración no existe: ${srcConfigFile}`);
  process.exit(1);
}

// Crear el directorio dist si no existe
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Crear el directorio config dentro de dist si no existe
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir);
}

// Copiar el archivo de configuración
fs.copyFileSync(srcConfigFile, destConfigFile);
console.log(`Archivo de configuración copiado a: ${destConfigFile}`);