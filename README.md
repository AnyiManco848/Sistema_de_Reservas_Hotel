# Sistema de Reservas de Hotel

Servicio backend en TypeScript que gestiona la disponibilidad y las reservas de las habitaciones de un hotel, evitando conflictos de fechas y problemas de capacidad.

Proyecto académico construido con arquitectura por capas, cobertura de pruebas unitarias, pruebas de mutantes (Stryker) y análisis de calidad de código continuo (SonarCloud).

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=AnyiManco848_Sistema_de_Reservas_Hotel&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=AnyiManco848_Sistema_de_Reservas_Hotel)

## Funcionalidades

- **Consultar disponibilidad**: lista las habitaciones libres para un rango de fechas y un número de huéspedes dados.
- **Crear una reserva**: registra una nueva reserva validando todas las reglas de negocio.
- **Cancelar una reserva**: libera la habitación para ese rango de fechas.
- **Calcular el costo total**: precio por noche × número de noches.

## Tipos de habitación

| Tipo | Precio por noche | Capacidad máxima |
|---|---|---|
| Estándar | $120.000 | 2 huéspedes |
| Familiar | $200.000 | 4 huéspedes |
| Premium | $350.000 | 2 huéspedes |

## Reglas de negocio

1. La habitación debe existir.
2. La fecha de entrada debe ser anterior a la fecha de salida.
3. La reserva debe tener mínimo una noche.
4. No se permiten fechas pasadas.
5. Una habitación no puede tener reservas traslapadas.
6. Una reserva cancelada libera la habitación.
7. El número de huéspedes debe ser mayor que 0.
8. El número de huéspedes no puede superar la capacidad de la habitación.
9. El costo total corresponde al precio por noche multiplicado por el número de noches.

## Arquitectura

Arquitectura por capas: **Models → Repositories → Services → CLI**, cada una con una única responsabilidad.

```
src/
├── models/            # Contratos de datos (Room, Reservation), sin lógica
│   ├── room.ts
│   └── reservation.ts
├── repositories/       # Acceso a datos: leer/guardar, sin reglas de negocio
│   ├── roomRepository.ts              (interfaz)
│   ├── jsonRoomRepository.ts          (lee data/rooms.json)
│   ├── reservationRepository.ts       (interfaz)
│   └── inMemoryReservationRepository.ts (almacenamiento en memoria)
├── services/           # Las 8 reglas de negocio viven aquí
│   ├── reservationService.ts          (interfaz — los 4 requerimientos)
│   └── reservationServiceImpl.ts      (implementación)
└── cli.ts              # Menú interactivo de terminal, sin lógica propia

data/
└── rooms.json          # Habitaciones registradas (id + tipo)

test/
└── services/
    └── reservationServiceImpl.test.ts # 25 pruebas unitarias
```

Cada interfaz (`RoomRepository`, `ReservationRepository`, `ReservationService`) desacopla el contrato de su implementación — permite reemplazar `JsonRoomRepository` por otra fuente de datos, o probar `ReservationServiceImpl` con repositorios falsos, sin tocar el resto del código.

## Requisitos

- Node.js 20 o superior
- npm

## Instalación

```bash
git clone https://github.com/AnyiManco848/Sistema_de_Reservas_Hotel.git
cd Sistema_de_Reservas_Hotel
npm install
```

## Uso

Menú interactivo por terminal para probar el sistema manualmente:

```bash
npm start
```

Permite consultar disponibilidad, crear y cancelar reservas, calcular costos y ver las habitaciones registradas.

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Corre el CLI interactivo |
| `npm run build` | Compila el proyecto con `tsc` |
| `npm test` | Corre las 25 pruebas unitarias con Vitest |
| `npm run test:coverage` | Corre las pruebas y genera el reporte de cobertura (`coverage/lcov.info`) |
| `npm run test:mutation` | Corre las pruebas de mutantes con Stryker |

## Pruebas

### Unitarias

25 pruebas con [Vitest](https://vitest.dev/), cubriendo las 8 reglas de negocio y los 4 métodos del servicio (`ReservationServiceImpl`), usando un repositorio de habitaciones falso (datos controlados en memoria) para no depender de `data/rooms.json` durante los tests.

### Cobertura

`reservationServiceImpl.ts` e `inMemoryReservationRepository.ts` —los archivos que contienen lógica de negocio real y se ejecutan en los tests— están al 100% de cobertura. `jsonRoomRepository.ts` y `cli.ts` quedan excluidos del reporte por diseño: solo se validan manualmente a través del CLI, no tienen prueba unitaria propia.

### Mutantes

Configurado con [StrykerJS](https://stryker-mutator.io/) + `@stryker-mutator/vitest-runner`, mutando únicamente los archivos con lógica de negocio cubierta por tests (`reservationServiceImpl.ts`, `inMemoryReservationRepository.ts`). Mutation score actual: **99.12%**.

Umbrales configurados en `stryker.conf.json`: `high: 80`, `low: 60`, `break: 50`.

## Calidad de código

Cada push a `master` y cada Pull Request dispara un análisis automático en SonarCloud vía GitHub Actions (`.github/workflows/sonarcloud.yml`), que corre las pruebas, genera el reporte de cobertura y lo sube junto con el análisis estático del código.

## Tecnologías

- TypeScript
- Node.js
- Vitest (pruebas unitarias y cobertura)
- StrykerJS (pruebas de mutantes)
- SonarCloud (calidad de código, CI/CD vía GitHub Actions)

prueba