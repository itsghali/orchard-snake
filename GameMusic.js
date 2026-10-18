class GameMusic {
  constructor() {
    this.context = null;
    this.lineOut = null;
    this.timer = null;
    this.step = 0;
    this.active = false;
    this.tempo = 104;
    this.melody = [67,71,74,76,74,71,69,67,64,67,71,74,72,69,67,64];
    this.bass = [48,48,45,45,41,41,43,43];
  }
  start() {
    if (this.active) return true;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext || typeof WebAudiox === 'undefined') return false;
    if (!this.context) {
      this.context = new AudioContext();
      this.lineOut = new WebAudiox.LineOut(this.context);
      this.lineOut.volume = 0.22;
    }
    this.active = true;
    this.resumeAndSchedule();
    return true;
  }
  resumeAndSchedule() {
    const begin = () => {
      if (!this.active) return;
      if (this.lineOut.isMuted) this.lineOut.toggleMute();
      this.schedule();
      if (!this.timer) this.timer = setInterval(() => this.schedule(), (60 / this.tempo / 2) * 1000);
    };
    if (this.context.state === 'suspended' && this.context.resume) {
      Promise.resolve(this.context.resume()).then(begin).catch(() => { this.active = false; });
    } else begin();
  }
  note(midi, duration, type, volume) {
    if (!this.context || !this.active) return;
    const now = this.context.currentTime, oscillator = this.context.createOscillator(), gain = this.context.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(440 * 2 ** ((midi - 69) / 12), now);
    gain.gain.setValueAtTime(0.0001, now); gain.gain.exponentialRampToValueAtTime(volume, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain); gain.connect(this.lineOut.destination); oscillator.start(now); oscillator.stop(now + duration + 0.02);
  }
  schedule() {
    if (!this.active) return;
    this.note(this.melody[this.step % this.melody.length], 0.22, 'triangle', 0.28);
    if (this.step % 2 === 0) this.note(this.bass[(this.step / 2) % this.bass.length], 0.42, 'sine', 0.22);
    if (this.step % 4 === 2) this.note(79, 0.07, 'square', 0.06);
    this.step++;
  }
  toggle() {
    if (!this.context) return this.start();
    this.active = !this.active;
    this.lineOut.toggleMute();
    if (this.active) this.resumeAndSchedule();
    return this.active;
  }
}
