# Exportacion PDF desde Excel

La estrategia oficial del proyecto para PDF es:

1. Abrir la plantilla Excel original.
2. Completar solo las celdas dinamicas con `exceljs`.
3. Guardar un `.xlsx` temporal.
4. Convertir ese `.xlsx` a PDF con LibreOffice en modo headless.
5. Leer el PDF generado y borrar la carpeta temporal.

## Variables de entorno

```env
CERTIFICATE_TEMPLATE_PATH=C:/ruta/a/certiflow/backend/templates/CERTIFICADO VERIFICAR.xlsx
LIBREOFFICE_PATH=C:/Program Files/LibreOffice/program/soffice.exe
```

`LIBREOFFICE_PATH` es opcional si `soffice` ya esta disponible en el `PATH` del sistema.

## Instalacion en Windows

1. Descargar LibreOffice desde `https://www.libreoffice.org/download/download-libreoffice/`
2. Instalar con las opciones por defecto.
3. Verificar la ruta del ejecutable:

   - `C:\Program Files\LibreOffice\program\soffice.exe`
   - o `C:\Program Files (x86)\LibreOffice\program\soffice.exe`

4. Configurar `LIBREOFFICE_PATH` en `backend/.env` si no esta en `PATH`.

Comando de prueba:

```powershell
"C:\Program Files\LibreOffice\program\soffice.exe" --headless --version
```

## Instalacion en servidor Linux

Ejemplo Debian/Ubuntu:

```bash
sudo apt update
sudo apt install -y libreoffice
soffice --headless --version
```

Si `soffice` no queda en el `PATH`, definir `LIBREOFFICE_PATH` con la ruta completa del binario.

## Manejo de errores

Si LibreOffice no esta instalado o no se encuentra el binario, el backend responde con un error explicito:

- `No se encontro LibreOffice para exportar PDF. Instala LibreOffice y configura LIBREOFFICE_PATH apuntando a soffice.exe.`

Si el `.xlsx` no se convierte correctamente:

- `LibreOffice no genero el PDF esperado. Revisa la plantilla, el area de impresion y la instalacion de LibreOffice.`

## Notas operativas

- El Excel descargable sigue saliendo desde la misma plantilla.
- El PDF se genera a partir de ese Excel y no desde un layout manual.
- Los archivos temporales se crean en la carpeta temporal del sistema y se eliminan al finalizar cada exportacion.
