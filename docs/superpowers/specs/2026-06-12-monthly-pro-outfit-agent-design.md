# Monthly Pro Outfit Intelligence Agent Design

## Summary

Sub-project F adds a monthly research-and-drafting agent for professional tennis outfit updates. It should collect public ATP/WTA official news and ranking context, extract candidate outfit information, and create unpublished catalog drafts for human review. It must not copy official match photos into CourtFit AI as site assets.

## Goals

- Run monthly for ATP and WTA top players.
- Gather official ATP/WTA article URLs, player names, event context, and visible outfit cues.
- Draft structured outfit candidates with tour, rank, season month, clothing items, color notes, source references, and image-generation prompt notes.
- Keep drafts unpublished until a human approves them.
- Support future own-brand collections alongside player-inspired outfits without changing the catalog model.

## Non-Goals

- No automatic public publishing in v1.
- No scraping or storing copyrighted player/news photos as public product imagery.
- No claim that representative brand items are exact match-worn products unless independently verified.
- No monthly scheduler deployment until the current manual catalog and generation flow are stable.

## Proposed Workflow

1. Monthly job identifies target players from the current ATP/WTA ranking source.
2. Research step collects official ATP/WTA news URLs and article image metadata as source references.
3. Extraction step produces a draft outfit: top, bottom, shoes, socks, wristband, headwear, colors, court/event context, and confidence notes.
4. Review step stores the candidate as unpublished `PLAYER_INSPIRED` data with source references.
5. Human review approves, edits, or rejects the draft before it appears in `/outfits`.

## Safety And Rights

- Use official images as research references only.
- Public display should use original flat-lay illustrations, generated outfit-combination imagery, or licensed/self-owned assets.
- Every published outfit should include source URLs and conservative wording such as “inspired” or “representative” unless exact products are verified.

## First Implementation Slice

- Add an internal draft data shape and review status concept.
- Add a manual command or script that writes one month of candidate JSON without publishing.
- Add tests that candidate data includes source URLs, player/ranking context, item categories, and unpublished status.
