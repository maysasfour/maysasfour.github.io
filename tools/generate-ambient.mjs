import { mkdirSync, writeFileSync } from 'node:fs';

const sampleRate = 22050;
const duration = 32;
const frames = sampleRate * duration;
const channels = 2;
const buffer = Buffer.alloc(44 + frames * channels * 2);

const writeString = (offset, value) => buffer.write(value, offset, 'ascii');
writeString(0, 'RIFF');
buffer.writeUInt32LE(buffer.length - 8, 4);
writeString(8, 'WAVE');
writeString(12, 'fmt ');
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(channels, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * channels * 2, 28);
buffer.writeUInt16LE(channels * 2, 32);
buffer.writeUInt16LE(16, 34);
writeString(36, 'data');
buffer.writeUInt32LE(frames * channels * 2, 40);

const noteNames = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
const frequency = name => {
  const match = name.match(/^([A-G]#?)(-?\d)$/);
  const midi = (Number(match[2]) + 1) * 12 + noteNames[match[1]];
  return 440 * (2 ** ((midi - 69) / 12));
};
const events = [];
const add = (name, start, length, volume = .11) => events.push({ frequency: frequency(name), start, length, volume });
const theme = ['E5', 'D#5', 'E5', 'D#5', 'E5', 'B4', 'D5', 'C5', 'A4', 'C4', 'E4', 'A4', 'B4', 'E4', 'G#4', 'B4', 'C5', 'E4', 'E5', 'D#5', 'E5', 'D#5', 'E5', 'B4', 'D5', 'C5', 'A4', 'C4', 'E4', 'A4', 'B4', 'E4', 'C5', 'B4', 'A4'];
const unit = .34;
for (let repeat = 0; repeat < 3; repeat++) {
  const offset = repeat * theme.length * unit;
  theme.forEach((note, index) => add(note, offset + index * unit, index % 9 === 8 ? unit * 1.7 : unit * .92, .13));
  const bass = ['A2', 'E3', 'A3', 'E3', 'E2', 'B2', 'E3', 'B2', 'A2', 'E3', 'A3', 'E3'];
  bass.forEach((note, index) => add(note, offset + index * unit * 3, unit * 2.7, .06));
}

for (let frame = 0; frame < frames; frame++) {
  const time = frame / sampleRate;
  let value = 0;
  for (const event of events) {
    const noteTime = time - event.start;
    if (noteTime < 0 || noteTime > event.length * 4.2) continue;
    const attack = Math.min(1, noteTime * 80);
    const decay = Math.exp(-noteTime * 3.1);
    const tone = Math.sin(Math.PI * 2 * event.frequency * noteTime) + .32 * Math.sin(Math.PI * 2 * event.frequency * 2 * noteTime) + .12 * Math.sin(Math.PI * 2 * event.frequency * 3 * noteTime);
    value += tone * event.volume * attack * decay;
  }
  value = Math.max(-.82, Math.min(.82, value * .74));
  const left = value * (0.96 + Math.sin(time * .25) * .04);
  const right = value * (0.96 - Math.sin(time * .25) * .04);
  buffer.writeInt16LE(Math.round(left * 32767), 44 + frame * 4);
  buffer.writeInt16LE(Math.round(right * 32767), 46 + frame * 4);
}

mkdirSync('assets', { recursive: true });
writeFileSync('assets/mays-ambient.wav', buffer);
