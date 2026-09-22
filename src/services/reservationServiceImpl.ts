// src/services/reservationServiceImpl.ts
import { randomUUID } from "node:crypto";
import { Room } from "../models/room";
import { Reservation } from "../models/reservation";
import { ReservationService } from "./reservationService";
import { RoomRepository } from "../repositories/roomRepository";
import { ReservationRepository } from "../repositories/reservationRepository";

export class ReservationServiceImpl implements ReservationService {
  constructor(
    private roomRepository: RoomRepository,
    private reservationRepository: ReservationRepository
  ) {}

  calcularCostoTotal(roomId: string, checkIn: Date, checkOut: Date): number {
    const room = this.roomRepository.findById(roomId);
    if (!room) {
      throw new Error("La habitación no existe");
    }
    const noches = this.calcularNoches(checkIn, checkOut);
    return room.pricePerNight * noches;
  }

  consultarDisponibilidad(checkIn: Date, checkOut: Date, guests: number): Room[] {
    const habitaciones = this.roomRepository.findAll();

    return habitaciones.filter((room) => {
      const cabenLosHuespedes = guests > 0 && guests <= room.maxCapacity;
      if (!cabenLosHuespedes) {
        return false;
      }
      return !this.tieneTraslape(room.id, checkIn, checkOut);
    });
  }

  crearReserva(roomId: string, checkIn: Date, checkOut: Date, guests: number): Reservation {
    const room = this.roomRepository.findById(roomId);
    if (!room) {
      throw new Error("La habitación no existe");
    }

    if (checkIn >= checkOut) {
      throw new Error("La fecha de entrada debe ser anterior a la fecha de salida");
    }

    if (this.calcularNoches(checkIn, checkOut) < 1) {
      throw new Error("La reserva debe tener mínimo una noche");
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (checkIn < hoy) {
      throw new Error("No se permiten fechas pasadas");
    }

    if (guests <= 0 || guests > room.maxCapacity) {
      throw new Error("El número de huéspedes no es válido para esta habitación");
    }

    if (this.tieneTraslape(roomId, checkIn, checkOut)) {
      throw new Error("La habitación ya tiene una reserva en esas fechas");
    }

    const reservation: Reservation = {
      id: randomUUID(),
      roomId,
      checkIn,
      checkOut,
      guests,
      status: "Activa",
      totalCost: room.pricePerNight * this.calcularNoches(checkIn, checkOut),
    };

    this.reservationRepository.save(reservation);
    return reservation;
  }

  cancelarReserva(reservationId: string): void {
    const reservation = this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new Error("La reserva no existe");
    }
    reservation.status = "Cancelada";
  }

  private calcularNoches(checkIn: Date, checkOut: Date): number {
    return (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24);
  }

  private tieneTraslape(roomId: string, checkIn: Date, checkOut: Date): boolean {
    const reservas = this.reservationRepository.findByRoomId(roomId);
    return reservas.some(
      (reserva) =>
        reserva.status === "Activa" &&
        checkIn < reserva.checkOut &&
        reserva.checkIn < checkOut
    );
  }
}