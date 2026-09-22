import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import path from "node:path";
import { JsonRoomRepository } from "./repositories/jsonRoomRepository";
import { InMemoryReservationRepository } from "./repositories/inMemoryReservationRepository";
import { ReservationServiceImpl } from "./services/reservationServiceImpl";

const rl = createInterface({ input: stdin, output: stdout });

const roomsPath = path.resolve(process.cwd(), "data/rooms.json");
const roomRepository = new JsonRoomRepository(roomsPath);
const reservationRepository = new InMemoryReservationRepository();
const service = new ReservationServiceImpl(roomRepository, reservationRepository);

function parseFecha(texto: string): Date {
  return new Date(texto + "T00:00:00");
}

function mostrarMenu(): void {
  console.log("\n=== Sistema de Reservas de Hotel ===");
  console.log("1. Consultar disponibilidad");
  console.log("2. Crear una reserva");
  console.log("3. Cancelar una reserva");
  console.log("4. Calcular el costo total");
  console.log("5. Ver todas las habitaciones");
  console.log("0. Salir");
}

async function consultarDisponibilidad(): Promise<void> {
  const checkIn = await rl.question("Fecha de entrada (YYYY-MM-DD): ");
  const checkOut = await rl.question("Fecha de salida (YYYY-MM-DD): ");
  const guests = await rl.question("Número de huéspedes: ");

  const disponibles = service.consultarDisponibilidad(
    parseFecha(checkIn),
    parseFecha(checkOut),
    Number(guests)
  );

  if (disponibles.length === 0) {
    console.log("No hay habitaciones disponibles para esos criterios.");
    return;
  }

  console.log("\nHabitaciones disponibles:");
  disponibles.forEach((room) =>
    console.log(`  ${room.id} | ${room.type} | $${room.pricePerNight}/noche | capacidad ${room.maxCapacity}`)
  );
}

async function crearReserva(): Promise<void> {
  const roomId = await rl.question("ID de la habitación: ");
  const checkIn = await rl.question("Fecha de entrada (YYYY-MM-DD): ");
  const checkOut = await rl.question("Fecha de salida (YYYY-MM-DD): ");
  const guests = await rl.question("Número de huéspedes: ");

  try {
    const reserva = service.crearReserva(roomId, parseFecha(checkIn), parseFecha(checkOut), Number(guests));
    console.log("\nReserva creada:");
    console.log(reserva);
  } catch (error) {
    console.log(`\nError: ${(error as Error).message}`);
  }
}

async function cancelarReserva(): Promise<void> {
  const reservationId = await rl.question("ID de la reserva a cancelar: ");
  try {
    service.cancelarReserva(reservationId);
    console.log("\nReserva cancelada.");
  } catch (error) {
    console.log(`\nError: ${(error as Error).message}`);
  }
}

async function calcularCostoTotal(): Promise<void> {
  const roomId = await rl.question("ID de la habitación: ");
  const checkIn = await rl.question("Fecha de entrada (YYYY-MM-DD): ");
  const checkOut = await rl.question("Fecha de salida (YYYY-MM-DD): ");

  try {
    const costo = service.calcularCostoTotal(roomId, parseFecha(checkIn), parseFecha(checkOut));
    console.log(`\nCosto total: $${costo}`);
  } catch (error) {
    console.log(`\nError: ${(error as Error).message}`);
  }
}

function verHabitaciones(): void {
  console.log("\nHabitaciones registradas:");
  roomRepository.findAll().forEach((room) =>
    console.log(`  ${room.id} | ${room.type} | $${room.pricePerNight}/noche | capacidad ${room.maxCapacity}`)
  );
}

async function iniciar(): Promise<void> {
  let salir = false;

  while (!salir) {
    mostrarMenu();
    const opcion = await rl.question("Selecciona una opción: ");

    switch (opcion) {
      case "1": await consultarDisponibilidad(); break;
      case "2": await crearReserva(); break;
      case "3": await cancelarReserva(); break;
      case "4": await calcularCostoTotal(); break;
      case "5": verHabitaciones(); break;
      case "0": salir = true; break;
      default: console.log("Opción no válida.");
    }
  }

  rl.close();
}

iniciar();