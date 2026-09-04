/**
 * Real-Time Perfume Fluid Sloshing Physics Controller.
 *
 * Implements a 2D damped spring-mass oscillator simulating viscous liquid inertia,
 * bottle rotation sloshing, drag dynamics, bottle tilt gravity coupling,
 * and atomizer kinetic wave shocks.
 *
 * Physics Model:
 *   d²θ/dt² + 2ζω_n(dθ/dt) + ω_n² (θ - θ_gravity) = a_external
 *
 * Constants:
 *   ω_n = 11.5 rad/s (natural resonance frequency of 50ml perfume fluid cavity)
 *   ζ = 0.26 (viscous damping ratio of concentrated perfume oil)
 */

export type FluidPhysicsState = {
  sloshAngleX: number;
  sloshAngleZ: number;
  sloshVelocityX: number;
  sloshVelocityZ: number;
  wavePhase: number;
  energy: number;
};

export type FluidPhysics = {
  update: (dt: number, externalAccX: number, externalAccZ: number, tiltAngleX?: number, tiltAngleZ?: number) => void;
  triggerSprayImpulse: () => void;
  triggerPointerImpulse: (vx: number, vz: number) => void;
  getState: () => FluidPhysicsState;
  reset: () => void;
};

const OMEGA_N = 11.5;         // Natural frequency (rad/s)
const ZETA = 0.26;            // Viscous fluid damping ratio
const MAX_SLOSH_ANGLE = 0.40; // Clamped maximum meniscus tilt (radians) ~23 degrees
const TWO_ZETA_OMEGA = 2.0 * ZETA * OMEGA_N;
const OMEGA_SQ = OMEGA_N * OMEGA_N;

export function createFluidPhysics(): FluidPhysics {
  let angleX = 0;
  let angleZ = 0;
  let velX = 0;
  let velZ = 0;
  let wavePhase = 0;
  let energy = 0;

  return {
    update: (dt: number, externalAccX: number, externalAccZ: number, tiltAngleX = 0, tiltAngleZ = 0) => {
      if (dt <= 0) return;
      const step = Math.min(0.04, dt);

      // Target horizontal resting plane under gravity when container tilts
      const targetAngleX = -tiltAngleX * 0.85;
      const targetAngleZ = -tiltAngleZ * 0.85;
      const errorX = angleX - targetAngleX;
      const errorZ = angleZ - targetAngleZ;

      // Spring-mass-damper integration (semi-implicit Euler)
      const accSloshX = -TWO_ZETA_OMEGA * velX - OMEGA_SQ * errorX + externalAccX * 22.0;
      const accSloshZ = -TWO_ZETA_OMEGA * velZ - OMEGA_SQ * errorZ + externalAccZ * 22.0;

      velX += accSloshX * step;
      velZ += accSloshZ * step;

      // Viscous damping clamp
      velX *= Math.pow(0.89, step * 60.0);
      velZ *= Math.pow(0.89, step * 60.0);

      angleX += velX * step;
      angleZ += velZ * step;

      // Soft boundary clamp with restitution rebound
      if (Math.abs(angleX) > MAX_SLOSH_ANGLE) {
        angleX = Math.sign(angleX) * MAX_SLOSH_ANGLE;
        velX *= -0.28;
      }
      if (Math.abs(angleZ) > MAX_SLOSH_ANGLE) {
        angleZ = Math.sign(angleZ) * MAX_SLOSH_ANGLE;
        velZ *= -0.28;
      }

      // Energy metric for ripple amplitude and meniscus shimmer
      const kinetic = (velX * velX + velZ * velZ) * 0.5;
      const potential = (errorX * errorX + errorZ * errorZ) * 0.5;
      energy = Math.min(1.0, kinetic * 0.09 + potential * 2.8);

      // Phase progression proportional to activity
      wavePhase += (OMEGA_N + energy * 9.0) * step;
      if (wavePhase > 1000.0) wavePhase %= (Math.PI * 200.0);
    },

    triggerSprayImpulse: () => {
      // Atomizer pump depression sends a vertical kinetic shock wave and forward tilt
      velX += (Math.random() - 0.5) * 2.2;
      velZ += 2.6; // Forward slosh impulse
      energy = Math.min(1.0, energy + 0.90);
    },

    triggerPointerImpulse: (vx: number, vz: number) => {
      velX += vx * 0.18;
      velZ += vz * 0.18;
    },

    getState: () => ({
      sloshAngleX: angleX,
      sloshAngleZ: angleZ,
      sloshVelocityX: velX,
      sloshVelocityZ: velZ,
      wavePhase,
      energy,
    }),

    reset: () => {
      angleX = 0;
      angleZ = 0;
      velX = 0;
      velZ = 0;
      wavePhase = 0;
      energy = 0;
    },
  };
}
