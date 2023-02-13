import TicketService from "../src/pairtest/TicketService";
import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest";
import TicketPaymentService from "../src/thirdparty/paymentgateway/TicketPaymentService";
import SeatReservationService from "../src/thirdparty/seatbooking/SeatReservationService";

jest.mock("../src/thirdparty/paymentgateway/TicketPaymentService");
jest.mock("../src/thirdparty/seatbooking/SeatReservationService");

beforeEach(() => {
  TicketPaymentService.mockClear();
  SeatReservationService.mockClear();
});

describe("TicketService", () => {
  describe("happy path", () => {
    test("should request payment of correct value", () => {
      const service = new TicketService();
      service.purchaseTickets(
        201,
        new TicketTypeRequest("ADULT", 1),
        new TicketTypeRequest("CHILD", 2),
        new TicketTypeRequest("INFANT", 1)
      );
      const mockTSInstance = TicketPaymentService.mock.instances[0];
      const mockMakePayment = mockTSInstance.makePayment;
      expect(mockMakePayment).toHaveBeenCalledTimes(1);
      expect(mockMakePayment).toHaveBeenCalledWith(201, 40);
    });
    test("should call reserve Seat with correct number of seats", () => {
      const service = new TicketService();
      service.purchaseTickets(
        201,
        new TicketTypeRequest("ADULT", 1),
        new TicketTypeRequest("CHILD", 2),
        new TicketTypeRequest("INFANT", 1)
      );
      const mockSRInstance = SeatReservationService.mock.instances[0];
      const mockReserveSeat = mockSRInstance.reserveSeat;
      expect(mockReserveSeat).toHaveBeenCalledTimes(1);
      expect(mockReserveSeat).toHaveBeenCalledWith(201, 3);
      console.log(service.ticketTypeRequests)
    });
  });
  describe("incorrect account id/arguments passed", () => {
    test("errors out if < 2 arguements are passed", () => {
      const service = new TicketService();
      expect(() => {
        service.purchaseTickets(new TicketTypeRequest("ADULT", 5));
      }).toThrow("not enough arguments");
    });
    test("errors out if account ID is undefined", () => {
      const service = new TicketService();
      expect(() => {
        service.purchaseTickets(undefined, new TicketTypeRequest("ADULT", 5));
      }).toThrow("Invalid account id");
    });
    test("errors out if account ID is < 1", () => {
      const service = new TicketService();
      expect(() => {
        service.purchaseTickets(-1, new TicketTypeRequest("ADULT", 5));
      }).toThrow("Invalid account id");
    });
    test("errors out when account ID is not a number", () => {
      const service = new TicketService();
      expect(() => {
        service.purchaseTickets("1", new TicketTypeRequest("ADULT", 5));
      }).toThrow("Invalid account id");
    });
  });
  describe("incorrect ticket combos", () => {
    test("errors out if total tickets equals 0", () => {
      const service = new TicketService();
      expect(() => {
        service.purchaseTickets(
          201,
          new TicketTypeRequest("ADULT", 0),
          new TicketTypeRequest("CHILD", 0)
        );
      }).toThrow("Zero tickets have been requested");
    });
    test("errors out if infant tickets are purchased with out an adult ticket", () => {
      const service = new TicketService();
      expect(() => {
        service.purchaseTickets(201, new TicketTypeRequest("INFANT", 5));
      }).toThrow(
        "children must be supervised by an adult"
      );
    });
    test("errors out if child tickets are purchased with out an adult ticket", () => {
      const service = new TicketService();
      expect(() => {
        service.purchaseTickets(201, new TicketTypeRequest("CHILD", 5));
      }).toThrow(
        "children must be supervised by an adult"
      );
    });
    test("errors out if there are more infant tickets than adults", () => {
      const service = new TicketService();
      expect(() => {
        service.purchaseTickets(
          201,
          new TicketTypeRequest("ADULT", 1),
          new TicketTypeRequest("INFANT", 2)
        );
      }).toThrow("More infants than adults");
    });
  });
});
