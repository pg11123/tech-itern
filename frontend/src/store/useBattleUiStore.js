import { create } from 'zustand';
import { ACTION_MENU, UI_MODE } from '../config/constants';

// UI state of the battle screen. The battle controller writes it; HUD components read it and
// call the controller for input. `battle` is the engine state after the last engine call and
// `view` is what the HUD shows (it follows event playback).
export const INITIAL_BATTLE_UI = {
  controller: null,
  battle: null,
  view: null,
  mode: UI_MODE.LOADING,
  heroId: null,
  menu: ACTION_MENU.MAIN,
  pending: null, // intent waiting for a target: { type, skillId?, itemId? }
  targets: [],
  banner: null, // { key, params, id }
  paused: false,
  result: null,
  seed: null,
};

export const useBattleUiStore = create(() => ({ ...INITIAL_BATTLE_UI }));
