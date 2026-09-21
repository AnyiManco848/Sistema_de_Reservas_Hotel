import { Room } from "../models/room";

export interface RoomRepository {
  findAll(): Room[];
  findById(id: string): Room | undefined;
}