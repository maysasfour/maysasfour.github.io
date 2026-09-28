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

const chords = [
  [220, 261.63, 329.63, 392],
  [196, 246.94, 293.66, 369.99],
  [174.61, 220, 261.63, 329.63],
  [196, 246.94, 293.66, 392]
];
const melody = [659.25, 587.33, 523.25, 493.88, 523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 493.88, 440, 493.88, 523.25, 587.33];

for (let frame = 0; frame < frames; frame++) {
  const time = frame / sampleRate;
  const bar = Math.floor(time / 8) % chords.length;
  const chordTime = time % 8;
  const chordFade = Math.min(1, chordTime * 1.8, (8 - chordTime) * 1.2);
  let pad = 0;
  chords[bar].forEach((frequency, index) => {
    pad += Math.sin(Math.PI * 2 * frequency * time + index * .8) * (.035 / (index + 1));
    pad += Math.sin(Math.PI * 2 * frequency * .5 * time) * (.012 / (index + 1));
  });
  const noteIndex = Math.floor(time / .5) % melody.length;
  const noteTime = time % .5;
  const noteEnvelope = Math.min(1, noteTime * 12) * Math.max(0, 1 - noteTime * 1.7);
  const note = melody[noteIndex];
  const bell = (Math.sin(Math.PI * 2 * note * time) + .35 * Math.sin(Math.PI * 2 * note * 2 * time)) * .055 * noteEnvelope;
  const shimmer = Math.sin(Math.PI * 2 * 0.08 * time) * .008;
  const value = Math.max(-.82, Math.min(.82, (pad * chordFade) + bell + shimmer));
  const left = value * (0.94 + Math.sin(time * .3) * .06);
  const right = value * (0.94 - Math.sin(time * .3) * .06);
  buffer.writeInt16LE(Math.round(left * 32767), 44 + frame * 4);
  buffer.writeInt16LE(Math.round(right * 32767), 46 + frame * 4);
}

mkdirSync('assets', { recursive: true });
writeFileSync('assets/mays-ambient.wav', buffer);
