# Kukin: alacena inteligente y generador de recetas

Kukin es una aplicación móvil para Android que ayuda a decidir qué cocinar con lo que ya hay en casa y a reducir el desperdicio de comida. El usuario registra los ingredientes de su alacena y la app le sugiere recetas ordenadas según cuántos de esos ingredientes ya tiene. También le avisa con notificaciones locales cuando un ingrediente está por caducar.

Proyecto final escolar (Desarrollo de aplicaciones móviles, Fase IV).

---

## Funcionalidades implementadas

| Módulo | Qué hace |
|---|---|
| Autenticación | Registro e inicio de sesión con JWT (expira en 60 min). Las contraseñas se guardan con BCrypt. |
| Alacena | Agregar ingredientes (cantidad, unidad y caducidad, que se estima si se deja vacía), listarlos ordenados por caducidad y eliminarlos. |
| Notificaciones locales | Aviso en el celular 2 días antes de que caduque un ingrediente (Capacitor Local Notifications). |
| Recetas sugeridas | El backend cruza la alacena con la API de Spoonacular y ordena por % de coincidencia. Si Spoonacular no está disponible, usa el catálogo propio de recetas guardado en MySQL. |
| Detalle de receta | Ingredientes (indica cuáles ya tienes), pasos traducidos al español y una lista para ir marcando ingredientes mientras cocinas. |
| Dietas | Selección de un objetivo nutricional (se guarda en el dispositivo). |
| Perfil | Datos del usuario autenticado y cierre de sesión. |

**Pendiente (fuera del alcance de esta entrega):** plan Premium, escáner de refrigerador con visión por computadora y filtros dietéticos aplicados a las sugerencias.

---

## Arquitectura y tecnologías

```
┌──────────────────────────┐     HTTP/JSON + JWT    ┌───────────────────────────┐     ┌───────────────┐
│  App Android (Capacitor) │ ─────────────────────► │  Backend Spring Boot 3    │ ──► │  MySQL 8      │
│  React 19 + Vite +       │                        │  Java 17, Spring Security,│     └───────────────┘
│  Tailwind CSS 4          │                        │  Spring Data JPA          │ ──► Spoonacular API
└──────────────────────────┘                        └───────────────────────────┘     (la key vive solo aquí)
```

- **App móvil (`kukin-app/`):** React 19, Vite y Tailwind CSS, empaquetada como app nativa de Android con **Capacitor 7**. Plugins nativos: Local Notifications, App (botón "atrás" de Android) y Status Bar.
- **Backend (`backend-core/`):** Spring Boot 3.3 (Java 17), Spring Security con JWT, Spring Data JPA/Hibernate y Bean Validation.
- **Base de datos:** MySQL (tablas `user`, `ingredient`, `unit`, `inventory`, `recipe`, `recipe_ingredient`, `diet` y `recipe_diet`).
- **Servicios externos:** Spoonacular (recetas) y MyMemory (traducción de los pasos al español).

### Endpoints principales (`/api/v1`)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/register`, `/auth/login` | Registro e inicio de sesión (públicos) |
| GET | `/users/me` | Perfil del usuario autenticado |
| GET | `/ingredients`, `/units` | Catálogos para los formularios |
| GET / POST | `/inventory` | Listar y agregar ingredientes a la alacena |
| DELETE | `/inventory/{id}` | Eliminar un ingrediente (solo el dueño puede hacerlo) |
| GET | `/recipes/suggestions` | Recetas sugeridas según la alacena |
| GET | `/recipes/{id}?source=OWN\|SPOONACULAR` | Detalle de una receta |

---

## Cómo ejecutarlo

### Prerrequisitos
- Node.js 20 o superior
- JDK 17 o superior (sirve el que trae Android Studio: `C:\Program Files\Android\Android Studio\jbr`)
- Android Studio con el SDK 35 y un emulador (AVD)
- MySQL 8 (opcional: existe un perfil `demo` que usa una base de datos en memoria)

No hace falta instalar Maven: el proyecto incluye el Maven Wrapper (`mvnw`).

### 1. Variables de entorno (las claves nunca se suben al repositorio)
```bash
cp backend-core/.env.example backend-core/.env    # llenar DB_PASSWORD, JWT_SECRET, SPOONACULAR_API_KEY
cp kukin-app/.env.example kukin-app/.env
```

### 2. Backend
```bash
cd backend-core
./mvnw spring-boot:run                                   # con MySQL (base de datos kukin_db)
./mvnw spring-boot:run -Dspring-boot.run.profiles=demo   # sin MySQL, base de datos H2 en memoria
./mvnw test                                              # pruebas automatizadas
```
La primera vez que arranca con la base de datos vacía carga solo unidades, ingredientes y 3 recetas propias.

### 3. App en el emulador de Android
```bash
cd kukin-app
npm install
npm run android:sync     # compila la web y la copia al proyecto Android
npm run android:open     # abre Android Studio; ahí presiona ▶ Run con el emulador seleccionado
# o bien, generar el APK instalable:
npm run android:apk      # → android/app/build/outputs/apk/debug/app-debug.apk
```
En el emulador, la app cambia `localhost` por `10.0.2.2` (la dirección con la que el emulador ve a tu PC). Para probar en un celular físico, en `kukin-app/.env` pon `VITE_API_URL=http://<IP-de-tu-PC>:8080/api/v1` y vuelve a ejecutar `npm run android:sync`.

### Versión web (desarrollo)
```bash
cd kukin-app && npm run dev    # http://localhost:5173
```

---

## Pruebas

`backend-core/src/test` contiene 16 pruebas automatizadas (JUnit 5 + MockMvc + H2). Todas pasan con `./mvnw test`:

- Registro, correo duplicado (409), contraseña débil (422), login correcto e incorrecto (401)
- Endpoints protegidos sin token o con token inválido (401) y CORS para la app móvil
- Perfil y catálogos precargados
- Agregar, sumar, listar y eliminar inventario; un usuario no puede borrar el inventario de otro (404)
- Validaciones de cantidad, fecha mal formada (400) e ingrediente inexistente (404)
- Sugerencias de recetas por coincidencia y detalle con pasos e ingredientes
- Generación y validación de JWT; el servidor no arranca si falta `JWT_SECRET`

---

## Propiedad intelectual y licencias
**Copyright (c) 2026 Jesus Mendoza Gomez. Todos los derechos reservados.**

El código fuente, diseño, arquitectura y concepto visual de este repositorio se publican única y exclusivamente con fines de exhibición académica y evaluación de portafolio profesional.

No se otorga ninguna licencia de código abierto. Queda estrictamente prohibida la copia, distribución, modificación, sublicenciamiento, uso comercial o reproducción total o parcial de este software sin la autorización expresa y por escrito del autor.

## Autor
**Jesus Mendoza Gomez**
Desarrollador de Software | Ingeniería en Sistemas
