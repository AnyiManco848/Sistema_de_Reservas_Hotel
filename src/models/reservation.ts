export type ReservationStatus = "Activa" | "Cancelada";

export interface Reservation {
  id: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  status: ReservationStatus;
  totalCost: number;
}