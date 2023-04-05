import jsxElem, { render } from "jsx-no-react";
import { AppElement } from "./dom";
import { ErrorMessage } from "./error";
import { Poller } from "./poller";
import { LorIO } from "./lorio";
import { Heartbeat } from "./heartbeat";

export function CompatibleBrowserTest() {
  if ("serial" in navigator) {
    return SelectSerialPort();
  } else {
    return (
      <p>
        Your browser doesn't support the JavaScript requirements for
        communicating with serial port hardware. Please ensure you are using a
        compatible browser and try again.
      </p>
    );
  }
}

export function SelectSerialPort() {
  const handleDisconnectedSerialPort = () => {
    render(DisconnectedSerialPort(), AppElement);
  };

  async function openSerialPort() {
    try {
      let serialPort = await navigator.serial.requestPort({
        filters: [{ usbVendorId: 1027 }], // TODO: allow config
      });

      serialPort.ondisconnect = handleDisconnectedSerialPort;

      // options: https://wicg.github.io/serial/#serialoptions-dictionary
      // identified from testing with LOR hardware
      // FIXME: open should fire #onconnect, but doesn't seem to with LOR hardware
      await serialPort.open({
        baudRate: 19200, // TODO: allow config
        parity: "none",
        dataBits: 8,
        stopBits: 1,
      });

      render(<TestConnection serialPort={serialPort} />, AppElement);
    } catch (ex) {
      console.error("error opening serialport:", ex);

      if (ex.name === "NotFoundError") {
        // no serial port was selected (i.e. cancel button)
        // TODO: reset state anyways?
      } else {
        render(<ErrorMessage error={ex} />, AppElement);
      }
    }
  }

  return (
    <div>
      <p>
        Your browser may prompt you with a permission dialog to enable
        connecting to a serial port. This step is required for allowing
        Weblights to communicate with the Light-O-Rama hardware connected to
        your computer via your browser.
      </p>
      <button type="button" class="btn btn-primary" onclick={openSerialPort}>
        Select Light-O-Rama Serial Port
      </button>
    </div>
  );
}

export function DisconnectedSerialPort() {
  return (
    <div>
      <p>Connection lost or disconnected by user.</p>
      <button
        type="button"
        class="btn btn-primary"
        onclick={() => render(SelectSerialPort(), AppElement)}
      >
        Select New Serial Port
      </button>
    </div>
  );
}

export function TestConnection({ serialPort }) {
  const io = new LorIO(serialPort);

  const heartbeat = new Heartbeat(io);

  heartbeat.start();

  const poller = new Poller(io);

  let connectedUnits = [];

  const subview = () => (
    <ActiveConnection io={io} connectedUnits={connectedUnits} />
  );

  poller.start((newUnit) => {
    connectedUnits.push(newUnit);

    render(subview(), AppElement);
  });

  return subview();
}

function ActiveConnection({ io, connectedUnits }) {
  const closeSerialPort = async () => {
    try {
      await io.close();
    } catch (ex) {
      console.error("error while closing connection:", ex);
    } finally {
      render(SelectSerialPort(), AppElement);
    }
  };

  return (
    <div>
      <p>Serial port connected.</p>
      <ul>
        {connectedUnits.map((unit) => {
          return <li>{JSON.stringify(unit)}</li>;
        })}
      </ul>
      <button
        type="button"
        class="btn btn-outline-danger"
        onclick={closeSerialPort}
      >
        Disconnect
      </button>
    </div>
  );
}
