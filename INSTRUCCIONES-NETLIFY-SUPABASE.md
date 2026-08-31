# Despliegue: Netlify + Supabase

## 1. Crear la base de datos

1. Crea un proyecto en [Supabase](https://supabase.com/dashboard).
2. Abre **SQL Editor** y ejecuta el contenido de `supabase/migrations/001_economicos.sql`.
3. En **Project Settings > API**, copia:
   - Project URL (`SUPABASE_URL`)
   - `service_role` key (`SUPABASE_SERVICE_ROLE_KEY`)

La clave `service_role` da acceso completo: solo debe existir como variable privada de Netlify.

## 2. Publicar en Netlify

1. Sube esta carpeta a un repositorio privado de GitHub, GitLab o Bitbucket.
2. En Netlify, selecciona **Add new site > Import an existing project** y elige el repositorio.
3. Netlify detectará `netlify.toml`. No cambies el directorio de publicación (`.`) ni el de funciones (`netlify/functions`).
4. Antes de desplegar, en **Site configuration > Environment variables**, agrega las dos variables de `.env.netlify.example` con los valores de Supabase.
5. Ejecuta el despliegue.

## 3. Cargar los datos actuales

1. En la aplicación local, usa **Exportar CSV**.
2. Abre la URL de Netlify y usa **Importar archivo** con ese CSV.
3. La aplicación los guardará en Supabase automáticamente.

## Verificación

Abre `https://tu-sitio.netlify.app/api/status`. Debe responder `configured: true` y `provider: supabase`.
