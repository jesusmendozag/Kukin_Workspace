# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Ships as an Android app through Capacitor (React 19 + Tailwind 4 inside a WebView, target SDK 35, edge-to-edge). Primary device class: Android phones (tested on a realme GT6). No tablet or desktop layout is required.

## Users

- Latino students living away from home (foráneos) who cook for themselves on a tight budget and don't know what to make with what they have.
- Mexican and Latina moms who cook daily for the family and want to use what's already in the fridge before it spoils.

Both use the app in the kitchen, often one-handed, sometimes mid-cooking.

## Product Purpose

Kukin (by Naat Labs, Zapopan, Jalisco) answers "¿qué puedo cocinar con lo que tengo?". People register what is in their alacena/fridge, and Kukin suggests recipes ranked by how much of each recipe they already have, showing what is missing. Success: less food waste, faster decisions, value in the first session.

## Positioning

Recipes ordered by match percentage against the person's own pantry, with the missing ingredients named, in Spanish, for Mexican/Latino home cooking.

## Operating Context

Screens: login/registro, alacena (inventory with expiration urgency), agregar ingrediente, recetas sugeridas, detalle de receta (ingredients checklist + steps), dietas (local goal selection), perfil. Local notifications remind about expiring items. The app talks only to the Spring Boot API.

## Capabilities and Constraints

- Ingredient catalog comes from `GET /ingredients` (whole list with `nameEs`, `nameEn`, `category`); units from `GET /units`.
- Adding an ingredient must start from a visual grid of common ingredients, each with an emoji, with search as the fallback for anything else (REQ-04/REQ-05). Every ingredient shows an emoji.
- Dietas screen keeps its current content (fixed kcal goals stored locally); restyle only.
- Must use the full phone screen edge-to-edge and stay usable when the soft keyboard is open.
- Out of MVP: shopping list, meal planner, user recipes, payments, AI scanner.

## Brand Commitments

- Name: Kukin. Company: Naat Labs ("Naat" = inteligencia in Maya).
- Voice: de tú, cercano and warm, short sentences ("¿Qué cocinamos hoy?", "Te falta: cebolla").
- Mexican identity for a Latino audience; modern but simple.
- Binding design system (pinned by the user on 2026-11-25: "mantén lo más posible de lo de antes pero mejorándolo"): primary green `#2D7A47`, navy `#0B1E36` for titles and internal actions, cream `#FDFBF7` for inner screens, sand `#F7F3EE` for login, white cards; fresh `#E8F5E9`/`#2E7D32`, alert `#FFEBEE`/`#C62828`, medium match amber `#F59E0B`, discover `#EDE7F6`/`#4527A0`. Fraunces black for display titles, system sans for UI, uppercase tracked micro-labels. Very rounded shapes (cards 20–24px, containers 32–40px), 2-column ingredient cards with a pastel emoji corner and an always-visible delete X, rotate-3 FAB and avatar, active:scale feedback, staggered fade-in-up, floating white bottom nav. Headers stay compact (no tall colored headers).

## Evidence on Hand

Recipe photos come from the backend (`urlImage`). No testimonials, user counts, or press exist; do not invent any.

## Product Principles

1. Value in the first minute: tapping beats typing.
2. Fewer words, more emoji and photos.
3. Show the pantry's truth: what you have, what expires, what you're missing.
4. One-handed and kitchen-proof.

## Accessibility & Inclusion

Large text (base 17–18px) and large tap targets (≥48px); high contrast legible in a dim kitchen with low brightness; icons/emoji/photos alongside short labels. Spanish (es-MX) throughout.
