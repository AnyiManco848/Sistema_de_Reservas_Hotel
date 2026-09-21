export type roomType = "Estandar" | "Familiar" | "Premium";

export interface room {
  id: string;
  type: roomType;
  pricePerNight: number;
  maxCapacity: number;
}