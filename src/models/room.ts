export type RoomType = "Estandar" | "Familiar" | "Premium";

export interface Room {
  id: string;
  type: RoomType;
  pricePerNight: number;
  maxCapacity: number;
}