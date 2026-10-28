# Kukin - Smart Pantry & Recipe Generator

![Kukin Banner]([Enlace_a_una_imagen_alargada_de_tu_app_o_logo])

## Visión General
Kukin es una aplicación móvil diseñada principalmente para un proyecto final escolar, también para poder resolver la indecisión a la hora de saber que cocinar en el día a día y a su vez poder disminuir el desperdicio de comida. Esto se logrará por Mediante la gestión inteligente del inventario del hogar, la aplicación cruza los ingredientes disponibles en la alacena y refrigerador con una extensa base de datos para sugerir recetas viables, eliminando la necesidad de compras innecesarias.

---

## Características Principales

### Plan Gratuito (Core Features)
* **Gestión Rápida de Inventario:** Interfaz de selección mediante *chips* o *tags* para un "Cold Start" sin fricciones.
* **Buscador Predictivo:** Autocompletado manual conectado a una base de datos SQL normalizada.
* **Motor de Sugerencias:** Integración con la API de Spoonacular para retornar recetas ordenadas por el nivel de coincidencia con la alacena del usuario.

### Plan Premium (Integración IA)
* **Escáner de Refrigerador (Visión por Computadora):** Procesamiento de imágenes a través de un backend en Python para identificar y agregar ingredientes automáticamente.
* **Filtros Dietéticos:** Sugerencias adaptadas a objetivos específicos (veganismo, déficit calórico, volumen muscular).

---

## Arquitectura y Stack Tecnológico

El proyecto sigue una arquitectura cliente-servidor, separando la lógica de presentación, las reglas de negocio y el almacenamiento de datos.

* **Frontend:** React Native, Expo, Tailwind CSS (estética minimalista y utilitaria).
* **Microservicio de IA:** Python (Flask/FastAPI). Un servicio independiente dedicado exclusivamente a recibir fotografías, ejecutar modelos de visión por computadora y retornar al backend principal las etiquetas de los ingredientes detectados.
* **Base de Datos:** MySQL (Relacional, estructurada con tablas pivote para alta eficiencia).
* **Servicios Externos:** Spoonacular API.

### Modelado de Datos (ERD)
La base de datos está diseñada para evitar redundancias y garantizar búsquedas rápidas.

![Diagrama ERD de Kukin]([Sube_aquí_tu_archivo_DB_Kukin.drawio.png_y_pega_el_enlace])

---

## Instalación y Configuración Local

Si deseas correr este proyecto de manera local para evaluación técnica, sigue estos pasos:

### Prerrequisitos
* Node.js (v16 o superior)
* Expo CLI
* Java (JDK 17+) y Maven/Gradle
* MySQL Server

## Propiedad intelectual y Licencias 
**Copyright (c) 2026 Jesus Mendoza Gomez. Todos los derechos reservados.**

El código fuente, diseño, arquitectura y concepto visual de este repositorio se publican única y exclusivamente con fines de exhibición académica y evaluación de portafolio profesional.

No se otorga ninguna licencia de código abierto. Queda estrictamente prohibida la copia, distribución, modificación, sublicenciamiento, uso comercial o reproducción total o parcial de este software sin la autorización expresa y por escrito del autor.

## Autor
**Jesus Mendoza Gomez**
Desarrollador de Software | Ingeniería en Sistemas
