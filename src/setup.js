import jsxElem, { render } from "jsx-no-react";
import { AppElement } from "./dom";
import { ErrorMessage } from "./error";
import { Poller } from "./poller";
import { LorIO } from "./lorio";
import { Heartbeat } from "./heartbeat";
import { SequenceReader } from "./sequence";

export function CompatibleBrowserTest() {
  if ("serial" in navigator) {
    //return SelectSerialPort();
    return <OpenSequence />;
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

export function OpenSequence() {
  const handleFileSelected = (event) => {
    if (event.target.files.length === 0) {
      return;
    }

    event.target.disabled = true;

    const file = event.target.files[0];

    const fileReader = new FileReader();

    fileReader.onload = async (event) => {
      const sequenceReader = new SequenceReader(
        new DataView(event.target.result)
      );

      if (sequenceReader.isValidMagic()) {
        render(<SequenceInfo sequenceReader={sequenceReader} />, AppElement);
      } else {
        render(
          <ErrorMessage
            error={new Error("invalid file format magic sequence")}
          />,
          AppElement
        );
      }
    };

    fileReader.onerror = async (error) => {
      render(<ErrorMessage error={error} />, AppElement);
    };

    fileReader.readAsArrayBuffer(file);
  };

  // TODO: allow multiple upload in the future?
  return (
    <div>
      <input
        class="form-control"
        type="file"
        accept=".fseq"
        onchange={handleFileSelected}
        multiple={false}
      />
    </div>
  );
}

export function SequenceInfo({ sequenceReader }) {
  const duration = sequenceReader.getDuration();

  return (
    <div>
      <strong>Sequence Info</strong>
      <ul>
        <li>FSEQ version {sequenceReader.getVersion()}</li>
        <li>Channel count: {sequenceReader.getChannelCount()}</li>
        <li>
          {duration.frameCount} frames @ {duration.stepTimeMillis}ms step time
        </li>
        <li>
          {Math.round(duration.durationMillis / 1000)} seconds total duration
        </li>
      </ul>
      {sequenceReader.isCompressed() ? (
        <div>
          <div class="alert alert-danger">
            Sequence is compressed, and must be decompressed before it can be
            used with weblights as we have not added support for decompressing
            the file in the browser (yet).
          </div>
          <button
            type="button"
            class="btn-link"
            onclick={() => render(<OpenSequence />, AppElement)}
          >
            Select a different sequence
          </button>
        </div>
      ) : (
        <div>
          <button type="button" class="btn-success">
            Play Sequence
          </button>
        </div>
      )}
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
