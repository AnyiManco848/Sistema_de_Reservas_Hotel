import { Reservation } from "../models/reservation";
import { ReservationRepository } from "./reservationRepository";

export class InMemoryReservationRepository implements ReservationRepository {
  private reservations: Reservation[] = [];

  save(reservation: Reservation): void {
    // agrega "reservation" al arreglo this.reservations (usa .push())
     this.reservations.push(reservation);
  }

  findById(id: string): Reservation | undefined {
    // busca en this.reservations la que tenga ese id (usa .find(), igual que en JsonRoomRepository)
     return this.reservations.find((r) => r.id === id);
  }

  findByRoomId(roomId: string): Reservation[] {
    // devuelve solo las reservas de this.reservations cuyo roomId coincida (usa .filter())
     return this.reservations.filter((r) => r.roomId === roomId);
  }
}