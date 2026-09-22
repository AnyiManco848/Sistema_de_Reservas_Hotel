import { readFileSync } from "node:fs";
import { Room } from "../models/room";
import { RoomRepository } from "./roomRepository";

export class JsonRoomRepository implements RoomRepository {
  private rooms: Room[];

  constructor(jsonFilePath: string) {
    const contenido = readFileSync(jsonFilePath, "utf-8");
    this.rooms = JSON.parse(contenido);
  }

  findAll(): Room[] {
     return this.rooms;
  }

  findById(id: string): Room | undefined {
    return this.rooms.find((room) => room.id === id);
  }
}