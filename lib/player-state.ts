import type { DemoTrack } from "./demo-music";

export type RepeatMode = "off" | "all" | "one";
export type PlayerState = {
  queue: DemoTrack[];
  index: number;
  time: number;
  duration: number;
  playing: boolean;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  revision: number;
  error: string | null;
};
export function trackDuration(track: DemoTrack) {
  const [minutes, seconds] = track.duration.split(":").map(Number);
  return minutes * 60 + seconds;
}
export function initialPlayerState(queue: DemoTrack[]): PlayerState {
  return { queue, index: 0, time: 0, duration: queue[0] ? trackDuration(queue[0]) : 0, playing: false, volume: 0.65, shuffle: false, repeat: "off", revision: 0, error: null };
}
export type PlayerAction =
  | { type: "select"; queue: DemoTrack[]; index: number }
  | { type: "toggle" }
  | { type: "seek"; time: number }
  | { type: "tick"; elapsed: number }
  | { type: "time"; time: number }
  | { type: "duration"; duration: number }
  | { type: "next" | "previous" | "ended" | "repeat" }
  | { type: "volume"; volume: number }
  | { type: "shuffle"; queue: DemoTrack[] }
  | { type: "enqueue"; track: DemoTrack }
  | { type: "preferences"; volume: number; repeat: RepeatMode; shuffle: boolean; queue: DemoTrack[] }
  | { type: "error"; message: string };

function startAt(state: PlayerState, index: number): PlayerState {
  return { ...state, index, time: 0, duration: trackDuration(state.queue[index]), revision: state.revision + 1, error: null };
}
function advance(state: PlayerState, ended: boolean): PlayerState {
  if (!state.queue.length) return state;
  if (ended && state.repeat === "one") return startAt(state, state.index);
  if (state.index + 1 < state.queue.length) return startAt(state, state.index + 1);
  if (state.repeat === "all") return startAt(state, 0);
  return ended ? { ...state, playing: false, time: state.duration } : startAt(state, 0);
}
export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case "select":
      if (!action.queue[action.index]) return state;
      return startAt({ ...state, queue: action.queue, playing: true }, action.index);
    case "toggle":
      if (!state.queue.length) return state;
      return state.time >= state.duration || state.error
        ? { ...startAt(state, state.index), playing: true }
        : { ...state, playing: !state.playing };
    case "seek":
    case "time": return Number.isFinite(action.time) ? { ...state, time: Math.max(0, Math.min(action.time, state.duration)) } : state;
    case "tick":
      if (!state.playing) return state;
      return state.time + action.elapsed >= state.duration ? advance(state, true) : { ...state, time: state.time + action.elapsed };
    case "duration": return Number.isFinite(action.duration) && action.duration > 0 ? { ...state, duration: action.duration } : state;
    case "next": return advance(state, false);
    case "ended": return advance(state, true);
    case "previous": return state.queue.length ? startAt(state, state.time > 3 ? state.index : Math.max(0, state.index - 1)) : state;
    case "volume": return { ...state, volume: Math.max(0, Math.min(1, action.volume)) };
    case "repeat": return { ...state, repeat: state.repeat === "off" ? "all" : state.repeat === "all" ? "one" : "off" };
    case "shuffle": return { ...state, shuffle: !state.shuffle, queue: action.queue, index: action.queue.findIndex((track) => track.id === state.queue[state.index]?.id) };
    case "enqueue": {
      const current = state.queue[state.index];
      if (!current || action.track.id === current.id) return state;
      const queue = state.queue.filter((track) => track.id !== action.track.id);
      const index = queue.findIndex((track) => track.id === current.id);
      queue.splice(index + 1, 0, action.track);
      return { ...state, queue, index };
    }
    case "preferences": return { ...state, volume: action.volume, repeat: action.repeat, shuffle: action.shuffle, queue: action.queue, index: action.queue.findIndex((track) => track.id === state.queue[state.index]?.id) };
    case "error": return { ...state, playing: false, error: action.message };
  }
}

export function shuffledQueue(queue: DemoTrack[], currentId: number): DemoTrack[] {
  const rest = queue.filter((track) => track.id !== currentId);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  const current = queue.find((track) => track.id === currentId);
  return current ? [current, ...rest] : rest;
}
