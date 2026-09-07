// Helpers for the per-faction campaign arcs (chapters 6-40).
// C(...) is a chapter unique to that campaign; X(...) plays that campaign's side of a crossover event.
export const C = (title, theme, size, tier, style, params, story, briefing, epilogue, hints) => ({ title, theme, size, tier, style, params, story, briefing, epilogue, hints });
export const X = (crossover, tier) => ({ crossover, tier });
