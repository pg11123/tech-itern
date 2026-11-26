// gsap wrappers for the battle scene. Every tween and delay goes through one group, so the
// scene can kill them all on unmount, and pause / speed apply to all of them at once.
import { gsap } from 'gsap';

export function createTweenGroup() {
  const live = new Set();
  let killed = false;

  const track = (tween, resolve) => {
    live.add(tween);
    tween.eventCallback('onComplete', () => {
      live.delete(tween);
      resolve();
    });
  };

  return {
    // Resolves when the tween ends (never, if the group is killed first).
    to(targets, vars) {
      return new Promise((resolve) => {
        if (killed) return;
        track(gsap.to(targets, vars), resolve);
      });
    },
    fromTo(targets, from, to) {
      return new Promise((resolve) => {
        if (killed) return;
        track(gsap.fromTo(targets, from, to), resolve);
      });
    },
    wait(seconds) {
      return new Promise((resolve) => {
        if (killed) return;
        track(gsap.delayedCall(seconds, () => {}), resolve);
      });
    },
    killAll() {
      killed = true;
      for (const tween of live) tween.kill();
      live.clear();
    },
  };
}

// Global clock for all gsap animation (battle speed toggle and pause menu).
export function setAnimationSpeed(speed) {
  gsap.globalTimeline.timeScale(speed);
}

export function setAnimationPaused(paused) {
  if (paused) gsap.globalTimeline.pause();
  else gsap.globalTimeline.resume();
}
