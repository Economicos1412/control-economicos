# Conexión a Microsoft SQL Server

1. Crea una base de datos vacía, por ejemplo `ControlEconomicos`.
2. Copia `.env.example` como `.env` y completa los valores con tus datos. No compartas este archivo: contiene la contraseña si usas autenticación SQL.
3. Abre PowerShell en esta carpeta y ejecuta:

```powershell
$env:SQL_SERVER='SERVIDOR\\INSTANCIA'
$env:SQL_DATABASE='ControlEconomicos'
$env:SQL_USER='tu_usuario'
$env:SQL_PASSWORD='tu_contraseña'
npm start
```

Para autenticación de Windows, omite `SQL_USER` y `SQL_PASSWORD`. La aplicación confía únicamente en el certificado de tu instancia local (`-C` de `sqlcmd`); para un servidor de producción se debe instalar un certificado válido.

4. Abre `http://localhost:8080` en el navegador. La tabla se crea automáticamente en el primer acceso.

El programa sincroniza todos los económicos (incluidas fotos) después de cada cambio. Para usarlo desde otra computadora, ejecuta el servidor en el equipo autorizado y cambia `localhost` por la dirección IP o el nombre del servidor.
