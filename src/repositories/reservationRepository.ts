import { Reservation } from "../models/reservation";

export interface ReservationRepository {
  save(reservation: Reservation): void;
  findById(id: string): Reservation | undefined;
  findByRoomId(roomId: string): Reservation[];
}