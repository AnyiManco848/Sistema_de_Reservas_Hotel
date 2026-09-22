export type roomType = "Estandar" | "Familiar" | "Premium";

export interface Room {
  id: string;
  type: roomType;
  pricePerNight: number;
  maxCapacity: number;
}