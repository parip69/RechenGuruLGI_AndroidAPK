/* Shared, serializable two-attempt state for both school sections. */
(function (root) {
  'use strict';
  function create() {
    return { phase: 'editing', failures: 0, edited: false, lastAnswer: null, outcome: null, helped: false };
  }
  function edit(state) {
    if (state.phase !== 'done') state.edited = true;
  }
  function finish(state, outcome, advance = false) {
    if (state.phase === 'done') return { action: 'next' };
    state.phase = 'done';
    state.outcome = outcome;
    return { action: 'complete', outcome, advance, secondAttempt: outcome === 'correct' && state.failures > 0, helped: state.helped };
  }
  function submit(state, result) {
    if (state.phase === 'done') return { action: 'next' };
    if (state.phase === 'retry' && !state.edited && state.lastAnswer === result.answer) return finish(state, 'wrong', true);
    if (!result.valid) return { action: 'incomplete' };
    if (result.correct) return finish(state, 'correct');
    if (result.step) {
      state.phase = 'editing';
      state.edited = false;
      state.lastAnswer = null;
      return { action: 'step' };
    }
    state.failures++;
    state.lastAnswer = result.answer;
    state.edited = false;
    if (state.failures >= 2) return finish(state, 'wrong');
    state.phase = 'retry';
    return { action: 'retry' };
  }
  // One guard spans task changes and both controls, preventing key repeats and double taps.
  let lastAction = -Infinity;
  function accept(event) {
    if (event && (event.repeat || event.isComposing)) return false;
    const now = Date.now();
    if (now - lastAction < 250) return false;
    lastAction = now;
    return true;
  }
  const api = { create, edit, submit, finish, accept };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MatheAnswerFlow = api;
})(typeof window === 'undefined' ? globalThis : window);
