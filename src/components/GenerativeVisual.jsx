import React, { useRef, useEffect } from 'react';
import p5 from 'p5';
import * as Tone from 'tone';
import './GenerativeVisual.css';

const GenerativeVisual = ({ paramsRef, getParams }) => {
  const containerRef = useRef();
  const p5Instance = useRef(null);
  const audioSystemRef = useRef(null);
  const audioInitialized = useRef(false);

  useEffect(() => {
    const sketch = (p) => {
      let particles = [];
      let flowField = [];
      let cols, rows;
      let scale = 20;
      let zoff = 0;
      let colorPhase = 0;
      let liquidBlobs = [];
      let smokeParticles = [];
      let audioLoopStarted = false;

      // Initialize audio on first user interaction
      const initAudio = async () => {
        if (audioInitialized.current) return;

        try {
          await Tone.start();

          // Multiple synth layers for ambient sound
          const synth1 = new Tone.PolySynth(Tone.Synth, {
            envelope: { attack: 3, decay: 2, sustain: 0.5, release: 5 },
            oscillator: { type: 'sine' },
          });
          synth1.volume.value = -25;

          const synth2 = new Tone.PolySynth(Tone.Synth, {
            envelope: { attack: 4, decay: 3, sustain: 0.4, release: 6 },
            oscillator: { type: 'triangle' },
          });
          synth2.volume.value = -28;

          const synth3 = new Tone.PolySynth(Tone.FMSynth, {
            envelope: { attack: 2, decay: 1.5, sustain: 0.3, release: 4 },
          });
          synth3.volume.value = -30;

          // Reverb for spaciousness
          const reverb = new Tone.Reverb({ decay: 8, wet: 0.4 });
          await reverb.generate();

          synth1.connect(reverb);
          synth2.connect(reverb);
          synth3.connect(reverb);
          reverb.toDestination();

          // Generative note scales (pentatonic for consonance)
          const scales = {
            low: ['C2', 'D2', 'E2', 'G2', 'A2', 'C3'],
            mid: ['C3', 'D3', 'E3', 'G3', 'A3', 'C4', 'D4'],
            high: ['E4', 'G4', 'A4', 'C5', 'D5', 'E5'],
          };

          audioSystemRef.current = {
            synths: [synth1, synth2, synth3],
            scales,
            reverb,
          };

          audioInitialized.current = true;

          // Start transport
          if (Tone.Transport.state !== 'started') {
            Tone.Transport.start();
          }
        } catch (err) {
          console.error('Audio initialization error:', err);
        }
      };

      // Generative audio loop
      const startAudioLoop = () => {
        if (audioLoopStarted || !audioSystemRef.current) return;
        audioLoopStarted = true;

        const generateNote = () => {
          const params = paramsRef.current;
          if (!params.audioEnabled || !audioSystemRef.current) {
            setTimeout(generateNote, 1000);
            return;
          }

          const { synths, scales } = audioSystemRef.current;
          const complexity = params.complexity;
          const growth = params.growth;

          // Randomly choose scale based on complexity
          const scaleType = Math.random() < 0.3 ? 'low' : Math.random() < 0.7 ? 'mid' : 'high';
          const scale = scales[scaleType];
          const note = scale[Math.floor(Math.random() * scale.length)];

          // Choose synth based on growth
          const synthIndex = Math.floor(Math.random() * (1 + growth * 2));
          const synth = synths[Math.min(synthIndex, synths.length - 1)];

          // Duration based on flow
          const duration = (2 + Math.random() * 4 + params.flow * 3) + 's';

          if (synth) {
            synth.triggerAttackRelease(note, duration);
          }

          // Schedule next note
          const delay = 1000 + Math.random() * 3000 - complexity * 1000;
          setTimeout(generateNote, Math.max(500, delay));
        };

        // Start the generative loop
        setTimeout(generateNote, 1000);
      };

      class Particle {
        constructor() {
          this.pos = p.createVector(p.random(p.width), p.random(p.height));
          this.vel = p.createVector(0, 0);
          this.acc = p.createVector(0, 0);
          this.maxSpeed = 1.5 + p.random(0.5);
          this.prevPos = this.pos.copy();
          this.alpha = p.random(30, 150);
          this.size = p.random(0.5, 2.5);
          this.lifespan = p.random(300, 700);
          this.age = 0;
          this.hueOffset = p.random(360);
        }

        update() {
          const params = paramsRef.current;
          this.vel.add(this.acc);
          this.vel.limit(this.maxSpeed * (0.5 + params.flow));
          this.pos.add(this.vel);
          this.acc.mult(0);
          this.age++;

          if (this.age > this.lifespan) {
            this.pos = p.createVector(p.random(p.width), p.random(p.height));
            this.age = 0;
            this.prevPos = this.pos.copy();
          }

          if (this.pos.x > p.width) this.pos.x = 0;
          if (this.pos.x < 0) this.pos.x = p.width;
          if (this.pos.y > p.height) this.pos.y = 0;
          if (this.pos.y < 0) this.pos.y = p.height;
        }

        follow(vectors) {
          let x = p.floor(this.pos.x / scale);
          let y = p.floor(this.pos.y / scale);
          let index = x + y * cols;
          let force = vectors[index];
          if (force) {
            this.applyForce(force);
          }
        }

        applyForce(force) {
          this.acc.add(force);
        }

        show() {
          let fadeIn = p.min(this.age / 50, 1);
          let fadeOut = 1 - p.max((this.age - this.lifespan + 100) / 100, 0);
          let fade = fadeIn * fadeOut;

          p.strokeWeight(this.size);
          p.stroke(this.getColor(this.alpha * fade));

          if (p.dist(this.pos.x, this.pos.y, this.prevPos.x, this.prevPos.y) < 20) {
            p.line(this.pos.x, this.pos.y, this.prevPos.x, this.prevPos.y);
          }

          this.prevPos = this.pos.copy();
        }

        getColor(alpha = this.alpha) {
          const params = paramsRef.current;
          let hue = (colorPhase + this.hueOffset + this.pos.x * 0.08 + this.pos.y * 0.04) % 360;
          let sat = 40 + params.colorShift * 60;
          let bri = 70 + p.noise(this.pos.x * 0.01, this.pos.y * 0.01, p.frameCount * 0.01) * 30;
          p.colorMode(p.HSB, 360, 100, 100, 255);
          return p.color(hue, sat, bri, alpha);
        }
      }

      class SmokeParticle {
        constructor(x, y) {
          this.pos = p.createVector(x, y);
          this.vel = p.createVector(p.random(-0.5, 0.5), p.random(-1, -0.5));
          this.alpha = 120;
          this.size = p.random(20, 60);
          this.lifespan = 200;
          this.age = 0;
        }

        update() {
          this.pos.add(this.vel);
          this.vel.mult(0.98);
          this.age++;
          this.size += 0.5;
        }

        show() {
          let fade = 1 - (this.age / this.lifespan);
          p.noStroke();
          p.colorMode(p.HSB, 360, 100, 100, 255);
          let hue = (colorPhase + this.pos.x * 0.1) % 360;
          p.fill(hue, 30, 80, this.alpha * fade * 0.3);
          p.circle(this.pos.x, this.pos.y, this.size);
        }

        isDead() {
          return this.age >= this.lifespan;
        }
      }

      class LiquidBlob {
        constructor() {
          this.pos = p.createVector(p.random(p.width), p.random(p.height));
          this.vel = p.createVector(p.random(-0.5, 0.5), p.random(-0.5, 0.5));
          this.size = p.random(100, 300);
          this.phase = p.random(1000);
          this.hue = p.random(360);
        }

        update() {
          this.pos.add(this.vel);
          this.vel.add(p.createVector(p.random(-0.05, 0.05), p.random(-0.05, 0.05)));
          this.vel.mult(0.98);
          this.phase += 0.02;

          if (this.pos.x > p.width + 100) this.pos.x = -100;
          if (this.pos.x < -100) this.pos.x = p.width + 100;
          if (this.pos.y > p.height + 100) this.pos.y = -100;
          if (this.pos.y < -100) this.pos.y = p.height + 100;
        }

        show() {
          const params = paramsRef.current;
          p.push();
          p.noStroke();
          p.colorMode(p.HSB, 360, 100, 100, 255);

          let hue = (this.hue + colorPhase * 0.5) % 360;

          for (let i = 0; i < 3; i++) {
            let offset = i * 20;
            let alpha = 8 - i * 2;
            p.fill(hue, 50 + params.colorShift * 30, 60, alpha);

            p.beginShape();
            for (let a = 0; a < p.TWO_PI; a += 0.1) {
              let r = this.size + p.noise(
                p.cos(a) * 2 + this.phase,
                p.sin(a) * 2 + this.phase,
                this.phase
              ) * 50;
              let x = this.pos.x + p.cos(a) * r + offset;
              let y = this.pos.y + p.sin(a) * r + offset;
              p.vertex(x, y);
            }
            p.endShape(p.CLOSE);
          }
          p.pop();
        }
      }

      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.background(0);
        cols = p.floor(p.width / scale);
        rows = p.floor(p.height / scale);

        flowField = new Array(cols * rows);

        const params = paramsRef.current;
        let particleCount = p.floor(300 + params.density * 1200);
        for (let i = 0; i < particleCount; i++) {
          particles.push(new Particle());
        }

        for (let i = 0; i < 3 + p.floor(params.growth * 3); i++) {
          liquidBlobs.push(new LiquidBlob());
        }
      };

      p.draw = () => {
        const params = paramsRef.current;

        // Initialize and start audio loop when enabled
        if (params.audioEnabled && !audioLoopStarted) {
          initAudio().then(() => {
            startAudioLoop();
          });
        }

        p.background(0, 0, 0, 3 + params.flow * 8);

        for (let blob of liquidBlobs) {
          blob.update();
          blob.show();
        }

        let targetBlobCount = 3 + p.floor(params.growth * 4);
        while (liquidBlobs.length < targetBlobCount) {
          liquidBlobs.push(new LiquidBlob());
        }
        while (liquidBlobs.length > targetBlobCount) {
          liquidBlobs.pop();
        }

        let yoff = 0;
        for (let y = 0; y < rows; y++) {
          let xoff = 0;
          for (let x = 0; x < cols; x++) {
            let index = x + y * cols;
            let angle = p.noise(xoff, yoff, zoff) * p.TWO_PI * 3;
            let v = p5.Vector.fromAngle(angle);
            v.setMag(0.2 + params.complexity * 0.8);
            flowField[index] = v;
            xoff += 0.08 * (1 + params.complexity * 0.5);
          }
          yoff += 0.08 * (1 + params.complexity * 0.5);
        }

        zoff += 0.002 * (1 + params.flow * 2);
        colorPhase += 0.15 + params.colorShift * 0.4;

        let targetCount = p.floor(300 + params.density * 1200);
        while (particles.length < targetCount) {
          particles.push(new Particle());
        }
        while (particles.length > targetCount) {
          particles.pop();
        }

        for (let particle of particles) {
          particle.follow(flowField);
          particle.update();
          particle.show();
        }

        for (let i = smokeParticles.length - 1; i >= 0; i--) {
          smokeParticles[i].update();
          smokeParticles[i].show();
          if (smokeParticles[i].isDead()) {
            smokeParticles.splice(i, 1);
          }
        }

        if (p.frameCount % p.floor(40 / (1 + params.growth * 2)) === 0 && params.growth > 0.2) {
          let x = p.random(p.width);
          let y = p.random(p.height);
          for (let i = 0; i < 3; i++) {
            smokeParticles.push(new SmokeParticle(x + p.random(-20, 20), y + p.random(-20, 20)));
          }
        }

        if (p.frameCount % p.floor(120 / (1 + params.growth * 3)) === 0) {
          let x = p.random(p.width);
          let y = p.random(p.height);
          let size = 80 + params.growth * 250;

          p.noStroke();
          p.colorMode(p.HSB, 360, 100, 100, 255);
          let hue = (colorPhase + p.random(60)) % 360;

          for (let i = 0; i < 8; i++) {
            let alpha = 12 - i * 1.5;
            p.fill(hue, 60 + params.colorShift * 30, 80, alpha);
            p.circle(x, y, size + i * 30);
          }
        }
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        cols = p.floor(p.width / scale);
        rows = p.floor(p.height / scale);
        flowField = new Array(cols * rows);
      };

      p.mousePressed = async () => {
        const params = paramsRef.current;

        // Initialize audio on first click
        if (!audioInitialized.current) {
          await initAudio();
        }

        if (params.audioEnabled && audioSystemRef.current) {
          const freq = p.map(p.mouseY, 0, p.height, 200, 800);
          const note = Tone.Frequency(freq, 'hz').toNote();
          audioSystemRef.current.synths[0].triggerAttackRelease(note, '3n');

          for (let i = 0; i < 8; i++) {
            smokeParticles.push(new SmokeParticle(
              p.mouseX + p.random(-30, 30),
              p.mouseY + p.random(-30, 30)
            ));
          }
        }
      };
    };

    p5Instance.current = new p5(sketch, containerRef.current);

    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove();
      }
      if (audioSystemRef.current) {
        audioSystemRef.current.synths.forEach(synth => {
          try {
            synth.dispose();
          } catch (e) {}
        });
        try {
          audioSystemRef.current.reverb.dispose();
        } catch (e) {}
      }
      try {
        Tone.Transport.stop();
      } catch (e) {}
    };
  }, [paramsRef, getParams]);

  return <div ref={containerRef} className="generative-visual" />;
};

export default GenerativeVisual;
