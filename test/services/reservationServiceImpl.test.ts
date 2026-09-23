import { describe, it, expect, beforeEach } from "vitest";
import { ReservationServiceImpl } from "../../src/services/reservationServiceImpl";
import { InMemoryReservationRepository } from "../../src/repositories/inMemoryReservationRepository";
import { RoomRepository } from "../../src/repositories/roomRepository";
import { Room } from "../../src/models/room";

function diasDesdeHoy(dias: number): Date {
  const fecha = new Date();
  fecha.setHours(0, 0, 0, 0);
  fecha.setDate(fecha.getDate() + dias);
  return fecha;
}

describe("ReservationServiceImpl", () => {
  let service: ReservationServiceImpl;
  let rooms: Room[];
  let reservationRepository: InMemoryReservationRepository;

  beforeEach(() => {
    rooms = [
      { id: "STD-101", type: "Estandar", pricePerNight: 120000, maxCapacity: 2 },
      { id: "FAM-201", type: "Familiar", pricePerNight: 200000, maxCapacity: 4 },
    ];

    const roomRepository: RoomRepository = {
      findAll: () => rooms,
      findById: (id) => rooms.find((r) => r.id === id),
    };

    reservationRepository = new InMemoryReservationRepository();
    service = new ReservationServiceImpl(roomRepository, reservationRepository);
  });

  describe("calcularCostoTotal", () => {
    it("calcula precio por noche x número de noches", () => {
      const costo = service.calcularCostoTotal("STD-101", new Date("2026-05-01"), new Date("2026-05-04"));
      expect(costo).toBe(360000);
    });

    it("lanza error si la habitación no existe", () => {
      expect(() =>
        service.calcularCostoTotal("NO-EXISTE", new Date("2026-05-01"), new Date("2026-05-04"))
      ).toThrow("La habitación no existe");
    });
  });

  describe("consultarDisponibilidad", () => {
    it("devuelve solo habitaciones donde caben los huéspedes pedidos", () => {
      const disponibles = service.consultarDisponibilidad(diasDesdeHoy(5), diasDesdeHoy(8), 3);
      expect(disponibles).toHaveLength(1);
      expect(disponibles[0].id).toBe("FAM-201");
    });

    it("excluye una habitación que ya tiene una reserva activa en esas fechas", () => {
      service.crearReserva("STD-101", diasDesdeHoy(10), diasDesdeHoy(13), 1);
      const disponibles = service.consultarDisponibilidad(diasDesdeHoy(11), diasDesdeHoy(12), 1);
      expect(disponibles.find((r) => r.id === "STD-101")).toBeUndefined();
      expect(disponibles.find((r) => r.id === "FAM-201")).toBeDefined();
    });

    it("incluye una habitación cuya única reserva en esas fechas está cancelada", () => {
      const reserva = service.crearReserva("STD-101", diasDesdeHoy(10), diasDesdeHoy(13), 1);
      service.cancelarReserva(reserva.id);
      const disponibles = service.consultarDisponibilidad(diasDesdeHoy(11), diasDesdeHoy(12), 1);
      expect(disponibles.find((r) => r.id === "STD-101")).toBeDefined();
    });

    // NUEVO: huéspedes exactamente igual a la capacidad máxima sí debe caber
    it("incluye una habitación cuando guests es exactamente igual a la capacidad máxima", () => {
      const disponibles = service.consultarDisponibilidad(diasDesdeHoy(5), diasDesdeHoy(8), 2);
      expect(disponibles.find((r) => r.id === "STD-101")).toBeDefined();
    });

    // NUEVO: 0 huéspedes no debe considerar ninguna habitación disponible
    it("no incluye ninguna habitación si guests es 0", () => {
      const disponibles = service.consultarDisponibilidad(diasDesdeHoy(5), diasDesdeHoy(8), 0);
      expect(disponibles).toHaveLength(0);
    });
  });

  describe("crearReserva", () => {
    it("lanza error si la habitación no existe", () => {
      expect(() =>
        service.crearReserva("NO-EXISTE", diasDesdeHoy(10), diasDesdeHoy(13), 1)
      ).toThrow("La habitación no existe");
    });

    it("lanza error si checkIn no es anterior a checkOut", () => {
      expect(() =>
        service.crearReserva("STD-101", diasDesdeHoy(10), diasDesdeHoy(5), 1)
      ).toThrow("La fecha de entrada debe ser anterior a la fecha de salida");
    });

    // NUEVO: checkIn igual a checkOut también debe fallar, no solo checkIn > checkOut
    it("lanza error si checkIn es igual a checkOut", () => {
      const mismaFecha = diasDesdeHoy(10);
      expect(() =>
        service.crearReserva("STD-101", mismaFecha, mismaFecha, 1)
      ).toThrow("La fecha de entrada debe ser anterior a la fecha de salida");
    });

    it("lanza error si la reserva no tiene mínimo una noche", () => {
      const checkIn = diasDesdeHoy(10);
      const checkOut = new Date(checkIn);
      checkOut.setHours(checkOut.getHours() + 12);
      expect(() => service.crearReserva("STD-101", checkIn, checkOut, 1)).toThrow(
        "La reserva debe tener mínimo una noche"
      );
    });

    // NUEVO: exactamente una noche sí debe permitirse
    it("permite una reserva de exactamente una noche", () => {
      expect(() =>
        service.crearReserva("STD-101", diasDesdeHoy(30), diasDesdeHoy(31), 1)
      ).not.toThrow();
    });

    it("lanza error si la fecha de entrada ya pasó", () => {
      expect(() =>
        service.crearReserva("STD-101", diasDesdeHoy(-1), diasDesdeHoy(0), 1)
      ).toThrow("No se permiten fechas pasadas");
    });

    // NUEVO: hoy mismo NO cuenta como fecha pasada
    it("permite crear una reserva con checkIn el día de hoy", () => {
      expect(() =>
        service.crearReserva("STD-101", diasDesdeHoy(0), diasDesdeHoy(3), 1)
      ).not.toThrow();
    });

    it("lanza error si guests es 0 o negativo", () => {
      expect(() =>
        service.crearReserva("STD-101", diasDesdeHoy(10), diasDesdeHoy(13), 0)
      ).toThrow("El número de huéspedes no es válido para esta habitación");
    });

    it("lanza error si guests supera la capacidad de la habitación", () => {
      expect(() =>
        service.crearReserva("STD-101", diasDesdeHoy(10), diasDesdeHoy(13), 3)
      ).toThrow("El número de huéspedes no es válido para esta habitación");
    });

    // NUEVO: guests exactamente igual a la capacidad sí debe permitirse
    it("permite una reserva cuando guests es exactamente igual a la capacidad", () => {
      expect(() =>
        service.crearReserva("STD-101", diasDesdeHoy(40), diasDesdeHoy(43), 2)
      ).not.toThrow();
    });

    it("lanza error si se traslapa con una reserva activa existente", () => {
      service.crearReserva("STD-101", diasDesdeHoy(10), diasDesdeHoy(13), 1);
      expect(() =>
        service.crearReserva("STD-101", diasDesdeHoy(11), diasDesdeHoy(14), 1)
      ).toThrow("La habitación ya tiene una reserva en esas fechas");
    });

    // NUEVO: una reserva que empieza el mismo día en que otra termina NO es traslape
    it("permite una reserva que empieza el mismo día en que termina otra", () => {
      service.crearReserva("STD-101", diasDesdeHoy(10), diasDesdeHoy(13), 1);
      expect(() =>
        service.crearReserva("STD-101", diasDesdeHoy(13), diasDesdeHoy(15), 1)
      ).not.toThrow();
    });

    // NUEVO: una reserva que termina el mismo día en que otra empieza NO es traslape
    it("permite una reserva que termina el mismo día en que empieza otra", () => {
      service.crearReserva("STD-101", diasDesdeHoy(20), diasDesdeHoy(23), 1);
      expect(() =>
        service.crearReserva("STD-101", diasDesdeHoy(17), diasDesdeHoy(20), 1)
      ).not.toThrow();
    });

    it("crea la reserva con status Activa y el totalCost correcto cuando todo es válido", () => {
      const reserva = service.crearReserva("STD-101", diasDesdeHoy(20), diasDesdeHoy(23), 1);
      expect(reserva.status).toBe("Activa");
      expect(reserva.totalCost).toBe(360000);
      expect(reserva.roomId).toBe("STD-101");
    });
  });

  describe("cancelarReserva", () => {
    it("lanza error si la reserva no existe", () => {
      expect(() => service.cancelarReserva("NO-EXISTE")).toThrow("La reserva no existe");
    });

    it("cambia el status de la reserva a Cancelada", () => {
      const reserva = service.crearReserva("STD-101", diasDesdeHoy(10), diasDesdeHoy(13), 1);
      service.cancelarReserva(reserva.id);
      const actualizada = reservationRepository.findById(reserva.id);
      expect(actualizada?.status).toBe("Cancelada");
    });

    it("libera la habitación: tras cancelar, se puede crear otra reserva en las mismas fechas", () => {
      const reserva1 = service.crearReserva("STD-101", diasDesdeHoy(10), diasDesdeHoy(13), 1);
      service.cancelarReserva(reserva1.id);
      expect(() =>
        service.crearReserva("STD-101", diasDesdeHoy(10), diasDesdeHoy(13), 1)
      ).not.toThrow();
    });

    // NUEVO: cancela específicamente la reserva pedida, no "la primera que encuentre"
    it("cancela la reserva correcta cuando hay varias en el repositorio", () => {
      const reservaA = service.crearReserva("STD-101", diasDesdeHoy(10), diasDesdeHoy(13), 1);
      const reservaB = service.crearReserva("FAM-201", diasDesdeHoy(15), diasDesdeHoy(18), 2);

      service.cancelarReserva(reservaB.id);

      expect(reservationRepository.findById(reservaA.id)?.status).toBe("Activa");
      expect(reservationRepository.findById(reservaB.id)?.status).toBe("Cancelada");
    });
  });
});