class AssemblyAIPCMWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this.pendingSamples = [];
    this.chunkSize = Math.max(800, Math.round(sampleRate * 0.05));
  }

  process(inputs) {
    const input = inputs[0]?.[0];

    if (!input) {
      return true;
    }

    for (let i = 0; i < input.length; i += 1) {
      const sample = Math.max(-1, Math.min(1, input[i]));
      this.pendingSamples.push(sample < 0 ? sample * 0x8000 : sample * 0x7fff);
    }

    while (this.pendingSamples.length >= this.chunkSize) {
      const pcm16 = new Int16Array(this.pendingSamples.splice(0, this.chunkSize));
      this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
    }

    return true;
  }
}

registerProcessor("assemblyai-pcm-worklet", AssemblyAIPCMWorklet);
