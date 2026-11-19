# Community ratings → accuracy

Rating kinds: `not_here`, `late_or_unhelpful`, `sensor_broken`, `missed_event`, `helpful`.

**Demo:** `buildCommunityComposeRatingItem` / `buildLockerRatingItem` shape pack rows (`community_compose_rating`); thin-pipe peers use host pack-announce deltas from those rows.

**Pipeline:** intent IDs → community rates → **community locker pack** → agent patterns → tune defaults/candidates → optional neural LoRA later.

**No classic RAG.** Structured retrieval only.