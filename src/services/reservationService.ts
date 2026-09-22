// src/services/reservationService.ts
import { Room } from "../models/room";
import { Reservation } from "../models/reservation";

export interface ReservationService {
  consultarDisponibilidad(checkIn: Date, checkOut: Date, guests: number): Room[];
  crearReserva(roomId: string, checkIn: Date, checkOut: Date, guests: number): Reservation;
  cancelarReserva(reservationId: string): void;
  calcularCostoTotal(roomId: string, checkIn: Date, checkOut: Date): number;
}