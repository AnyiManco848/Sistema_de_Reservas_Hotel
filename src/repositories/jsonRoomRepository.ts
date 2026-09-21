import { readFileSync } from "node:fs";
import { room } from "../models/room";
import { RoomRepository } from "./roomRepository";

export class JsonRoomRepository implements RoomRepository {
  private rooms: room[];

  constructor(jsonFilePath: string) {
    const contenido = readFileSync(jsonFilePath, "utf-8");
    this.rooms = JSON.parse(contenido);
  }

  findAll(): room[] {
     return this.rooms;
  }

  findById(id: string): room | undefined {
    return this.rooms.find((room) => room.id === id);
  }
}