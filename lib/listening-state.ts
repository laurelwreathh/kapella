// Будущие рекомендации используют только history. guestHistory хранится отдельно
// и явно исключена из данных музыкального профиля.
type PlaybackEntry = { id: number; trackId: number; playedAt: number };
export type ListeningEntry = PlaybackEntry & { mode: "normal"; eligibleForRecommendations: true };
export type GuestListeningEntry = PlaybackEntry & { mode: "guest"; eligibleForRecommendations: false };
export type ListeningState = {
  guestMode: boolean;
  history: ListeningEntry[];
  guestHistory: GuestListeningEntry[];
};
export const initialListeningState: ListeningState = { guestMode: false, history: [], guestHistory: [] };
export const MAX_LISTENING_ENTRIES = 500;
export type ListeningAction =
  | { type: "setGuestMode"; enabled: boolean }
  | { type: "recordPlayback"; trackId: number; playedAt: number };

export function listeningReducer(state: ListeningState, action: ListeningAction): ListeningState {
  if (action.type === "setGuestMode") return { ...state, guestMode: action.enabled };
  const entry = {
    // Длина массивов ограничена, поэтому она не подходит для новых уникальных ID.
    id: Math.max(0, ...state.history.map((item) => item.id), ...state.guestHistory.map((item) => item.id)) + 1,
    trackId: action.trackId,
    playedAt: action.playedAt,
  };
  if (state.guestMode) {
    const guestEntry: GuestListeningEntry = { ...entry, mode: "guest", eligibleForRecommendations: false };
    return { ...state, guestHistory: [guestEntry, ...state.guestHistory].slice(0, MAX_LISTENING_ENTRIES) };
  }
  const normalEntry: ListeningEntry = { ...entry, mode: "normal", eligibleForRecommendations: true };
  return { ...state, history: [normalEntry, ...state.history].slice(0, MAX_LISTENING_ENTRIES) };
}
