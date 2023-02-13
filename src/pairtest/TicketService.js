import InvalidPurchaseException from "./lib/InvalidPurchaseException.js";
import TicketPaymentService from "../thirdparty/paymentgateway/TicketPaymentService.js";
import SeatReservationService from "../thirdparty/seatbooking/SeatReservationService.js";

export default class TicketService {
  #paymentService = new TicketPaymentService();
  #seatReservationService = new SeatReservationService();

  constructor() {
    this.#paymentService = this.#paymentService;
    this.#seatReservationService = this.#seatReservationService;
  }

  sufficientParams(ticketTypeRequests) {
    if (ticketTypeRequests.length === 0) {
      throw new InvalidPurchaseException("not enough arguments");
    }
  }

  validAccountId(accountId) {
    if (!Number.isInteger(accountId) || !accountId || accountId < 1) {
      throw new TypeError("Invalid account id");
    }
  }

  validateTickets(ticketsPerCategory) {
    if (ticketsPerCategory.ADULT < ticketsPerCategory.INFANT) {
      throw new InvalidPurchaseException("More infants than adults");
    }
    const totalNumberOfTickets = Object.values(ticketsPerCategory).reduce(
      (previousValue, currentValue) => previousValue + currentValue
    );
    const maxAllowedTickets = 20;
    if (totalNumberOfTickets > maxAllowedTickets) {
      throw new InvalidPurchaseException(`Max of ${maxAllowedTickets} allowed`);
    }
    if (!ticketsPerCategory.hasOwnProperty("ADULT")) {
      throw new InvalidPurchaseException(
        "children must be supervised by an adult"
      );
    }
  }

  groupAndCountTickets(ticketTypeRequests) {
    const ticketsPerCategory = {};
    ticketTypeRequests.forEach((ticket) => {
      if (ticketsPerCategory.hasOwnProperty(ticket.getTicketType())) {
        ticketsPerCategory[ticket.getTicketType()] += ticket.getNoOfTickets();
      } else {
        ticketsPerCategory[ticket.getTicketType()] = ticket.getNoOfTickets();
      }
    });
    return ticketsPerCategory;
  }

  getOrZero(ticketsPerCategory, category) {
    if (ticketsPerCategory[category] === undefined) {
      return 0;
    }
    return ticketsPerCategory[category];
  }

  calculateTotalTicketCost(ticketsPerCategory) {
    const ticketPrices = {
      infant: 0,
      child: 10,
      adult: 20,
    };

    const totalAdultTicketPrice =
      ticketPrices.adult * this.getOrZero(ticketsPerCategory, "ADULT");
    const totalChildPrice =
      ticketPrices.child * this.getOrZero(ticketsPerCategory, "CHILD");
    const totalInfantPrice =
      ticketPrices.infant * this.getOrZero(ticketsPerCategory, "INFANT");

    const totalTicketPrice =
      totalAdultTicketPrice + totalChildPrice + totalInfantPrice;
    return totalTicketPrice;
  }

  calculateTotalNumberOfSeats(ticketsPerCategory) {
    const totalSeatsToReserve =
      this.getOrZero(ticketsPerCategory, "ADULT") +
      this.getOrZero(ticketsPerCategory, "CHILD");
    if (totalSeatsToReserve === 0) {
      throw new InvalidPurchaseException("Zero tickets have been requested");
    }
    return totalSeatsToReserve;
  }

  purchaseTickets(accountId, ...ticketTypeRequests) {
    this.sufficientParams(ticketTypeRequests);
    this.validAccountId(accountId);

    const ticketsPerCategory = this.groupAndCountTickets(ticketTypeRequests);
    this.validateTickets(ticketsPerCategory);

    const totalTicketPrice = this.calculateTotalTicketCost(ticketsPerCategory);

    this.#paymentService.makePayment(accountId, totalTicketPrice);

    const totalSeatsToReserve =
      this.calculateTotalNumberOfSeats(ticketsPerCategory);

    this.#seatReservationService.reserveSeat(accountId, totalSeatsToReserve);
  }
}
