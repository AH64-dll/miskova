import * as THREE from "three";
import { CAP_TRAVEL, PUSH_TRAVEL } from "./bottle/bottleModel";

/**
 * Mechanical controllers for the two moving parts.
 *
 * Both are integrators rather than CSS-style tweens: the cap is a real spring
 * (stiffness + exponential velocity decay) so it overshoots and settles, and the
 * atomizer is a two-phase mechanism (press down, then a damped rebound ring-out)
 * that fires its burst exactly at full compression.
 *
 * Travel constants are authored against a 1.72-unit reference bottle; `unit`
 * converts them into the mesh's local scale so the motion always covers the same
 * fraction of the finished height.
 */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (v: number) => {
  const x = clamp01(v);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
const easeOutCubic = (v: number) => 1 - Math.pow(1 - clamp01(v), 3);

export type CapSpring = {
  readonly progress: number;
  setTarget: (value: number, immediate?: boolean) => void;
  update: (dt: number) => void;
  reset: () => void;
};

export function createCapSpring(cap: THREE.Group, unit: number): CapSpring {
  const rest = cap.position.clone();
  const restQuat = cap.quaternion.clone();
  const liftedQuat = restQuat.clone().multiply(
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, CAP_TRAVEL.rotationY, CAP_TRAVEL.rotationZ, "XYZ")),
  );

  let progress = 0;
  let target = 0;
  let velocity = 0;

  const apply = () => {
    // Lift leads, lateral swing lags: the cap tips away as it clears the collar.
    const lift = easeInOut(progress / 0.48);
    const swing = easeInOut((progress - 0.38) / 0.62);
    const arc = Math.sin(swing * Math.PI) * 0.045;
    cap.position.copy(rest);
    cap.position.x += CAP_TRAVEL.offsetX * swing * unit;
    cap.position.y += (CAP_TRAVEL.lift * lift + arc) * unit;
    cap.position.z += CAP_TRAVEL.offsetZ * swing * unit;
    cap.quaternion.slerpQuaternions(restQuat, liftedQuat, swing);
  };

  return {
    get progress() {
      return progress;
    },
    setTarget: (value, immediate = false) => {
      target = clamp01(value);
      if (immediate) {
        progress = target;
        velocity = 0;
        apply();
      }
    },
    update: (dt) => {
      const step = Math.min(0.05, Math.max(0, dt));
      velocity += (target - progress) * 22 * step;
      velocity *= Math.exp(-8.5 * step);
      progress = clamp01(progress + velocity * step);
      if (Math.abs(target - progress) < 2e-4 && Math.abs(velocity) < 2e-4) {
        progress = target;
        velocity = 0;
      }
      apply();
      // Secondary resonance: a faint shudder while the cap is still travelling.
      cap.position.y += Math.sin(progress * Math.PI) * velocity * 0.035 * unit;
    },
    reset: () => {
      progress = 0;
      target = 0;
      velocity = 0;
      cap.position.copy(rest);
      cap.quaternion.copy(restQuat);
    },
  };
}

export type AtomizerSpring = {
  readonly active: boolean;
  press: () => boolean;
  update: (dt: number) => void;
  consumeBurst: () => boolean;
  reset: () => void;
};

const PRESS_DOWN_S = 0.12;
const PRESS_UP_S = 0.28;

export function createAtomizerSpring(push: THREE.Mesh, unit: number): AtomizerSpring {
  const restY = push.position.y;
  const travel = PUSH_TRAVEL * unit;
  let elapsed = 0;
  let active = false;
  let burstQueue = 0;
  let firedThisCycle = false;

  const finish = () => {
    elapsed = 0;
    active = false;
    firedThisCycle = false;
    push.position.y = restY;
  };

  return {
    get active() {
      return active;
    },
    press: () => {
      // Unblocked multi-spray: re-pressing during compression or rebound
      // resets downward compression stroke immediately and enqueues a burst
      burstQueue += 1;
      elapsed = 0;
      active = true;
      firedThisCycle = false;
      return true;
    },
    update: (dt) => {
      if (!active) return;
      elapsed += Math.min(0.05, Math.max(0, dt));
      if (elapsed <= PRESS_DOWN_S) {
        push.position.y = restY - travel * easeOutCubic(elapsed / PRESS_DOWN_S);
        return;
      }
      if (!firedThisCycle) {
        firedThisCycle = true;
      }
      const t = Math.min(1, (elapsed - PRESS_DOWN_S) / PRESS_UP_S);
      const rebound = easeOutCubic(t);
      // Damped ring-out as the piston returns: 2 smooth oscillations, then still.
      const ring = Math.sin(t * Math.PI * 3.6) * (1 - t) * 0.14;
      push.position.y = restY - travel * (1 - rebound + ring);
      if (t >= 1) {
        if (burstQueue > 0) {
          // Another queued press waiting
          elapsed = 0;
          firedThisCycle = false;
        } else {
          finish();
        }
      }
    },
    consumeBurst: () => {
      if (burstQueue > 0) {
        burstQueue -= 1;
        return true;
      }
      return false;
    },
    reset: () => {
      burstQueue = 0;
      finish();
    },
  };
}
