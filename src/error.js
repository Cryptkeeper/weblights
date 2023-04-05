import jsxElem, { render } from "jsx-no-react";
import { SelectSerialPort } from "./setup";
import { AppElement } from "./dom";

export function ErrorMessage({ error }) {
  return (
    <div>
      <p>
        Error: <code>{error.toString()}</code>
      </p>
      <button
        type="button"
        class="btn btn-outline-danger"
        onclick={() => render(SelectSerialPort(), AppElement)}
      >
        Restart Weblights
      </button>
    </div>
  );
}
