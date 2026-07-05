export function createReplayService() {
  return {
    saveReplay(replay) {
      return {
        ok: true,
        replay
      };
    }
  };
}
