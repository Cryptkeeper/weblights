export class SequenceReader {
  #dataView;

  constructor(dataView) {
    this.#dataView = dataView;
  }

  isValidMagic() {
    return this.#dataView.getUint32(0, true) === 1363497808;
  }

  getVersion() {
    const minor = this.#dataView.getUint8(6);
    const major = this.#dataView.getUint8(7);
    return `${major}.${minor}`;
  }

  getChannelCount() {
    return this.#dataView.getUint32(10, true);
  }

  getDuration() {
    let duration = {
      frameCount: this.#dataView.getUint32(14, true),
      stepTimeMillis: this.#dataView.getUint8(18),
    };

    duration.durationMillis = duration.frameCount * duration.stepTimeMillis;

    return duration;
  }

  isCompressed() {
    const compressionFlags = this.#dataView.getUint8(20);
    return (compressionFlags & 0x0f) > 0;
  }

  canPlay() {
    return true;
  }
}
