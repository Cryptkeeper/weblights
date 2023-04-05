export class Heartbeat {
  #io;

  constructor(io) {
    this.#io = io;
  }

  start() {
    let intervalTask = setInterval(async () => {
      if (!this.#io.isConnected()) {
        console.log("stopping heartbeat loop");

        clearInterval(intervalTask);
      } else {
        await this.#io.write([0xff, 0x81, 0x56]);
      }
    }, 500);
  }
}
