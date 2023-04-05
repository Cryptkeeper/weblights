const HostUnitId = 0xfe;
const PollMessageType = 0x29;

export class Poller {
  #io;

  constructor(io) {
    this.#io = io;
  }

  #nextUnitId = 0;
  #interrupt = false;

  start(cb) {
    this.#nextUnitId = 0;

    this.#pollNextUnit(cb);
  }

  interrupt() {
    this.#interrupt = true;
  }

  async #pollNextUnit(cb) {
    console.log("polling:", this.#nextUnitId);

    await this.#io.write([this.#nextUnitId, 136, PollMessageType, 0x2d]);

    let messages = await this.#io.read();

    messages.forEach((message) => {
      if (this.#isValidPollResponse(message)) {
        cb({
          unitId: this.#nextUnitId,
          unitType: message[2],
        });
      }
    });

    this.#nextUnitId++;

    if (
      this.#nextUnitId < HostUnitId &&
      this.#io.isConnected() &&
      !this.#interrupt
    ) {
      this.#pollNextUnit(cb);
    }
  }

  #isValidPollResponse(message) {
    const hostIndex = message.indexOf(HostUnitId);

    if (hostIndex === -1 || hostIndex + 1 >= message.length) {
      return false;
    } else {
      return message[hostIndex + 1] == PollMessageType;
    }
  }
}
