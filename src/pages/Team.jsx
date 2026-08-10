/**
 * Team.jsx  —  Fantasy Football Team View
 *
 * Features:
 *  • Sticky header row: POS | Player | Rank | Proj
 *  • Consume-as-you-assign slot logic (2-pass: exact match → flex/FLEX fill)
 *  • Left-aligned color-coded section labels: Offense, Defense, Bench, IR
 *  • DB/S defensive grouping (DB slot accepts DB, S, CB)
 *  • Compact Yahoo-style player tiles
 *  • Headshot loader with team-abbreviation badge fallback
 *  • Team abbreviation badge (no external logo dependency)
 *  • Rank badge with 4-tier color coding
 *  • Projected points via modalData.projections.current[player.id]
 *  • Bye week display
 *  • Status badges (Q, D, O, IR, SUSP, BYE)
 *  • Click-to-open modal integration
 */

import React, { useState, useCallback, useMemo } from 'react';
import './team.css';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * OFFENSE_SLOTS — ordered slot definitions for the offensive lineup.
 * Each entry: { label: display POS, accepts: Set of raw positions that fill it,
 *               flex: true means this slot is a FLEX-eligible catch-all }
 */
const OFFENSE_SLOTS = [
  { label: 'QB',   accepts: new Set(['QB']),                        flex: false },
  { label: 'RB',   accepts: new Set(['RB']),                        flex: false },
  { label: 'RB',   accepts: new Set(['RB']),                        flex: false },
  { label: 'WR',   accepts: new Set(['WR']),                        flex: false },
  { label: 'WR',   accepts: new Set(['WR']),                        flex: false },
  { label: 'TE',   accepts: new Set(['TE']),                        flex: false },
  { label: 'FLEX', accepts: new Set(['RB', 'WR', 'TE']),            flex: true  },
  { label: 'K',    accepts: new Set(['K', 'PK']),                   flex: false },
];

/**
 * DEFENSE_SLOTS — ordered slot definitions for the defensive lineup.
 * DB slot accepts DB, S (Safety), and CB.
 */
const DEFENSE_SLOTS = [
  { label: 'DL',   accepts: new Set(['DL', 'DE', 'DT', 'NT']),      flex: false },
  { label: 'DL',   accepts: new Set(['DL', 'DE', 'DT', 'NT']),      flex: false },
  { label: 'LB',   accepts: new Set(['LB', 'ILB', 'OLB', 'MLB']),   flex: false },
  { label: 'LB',   accepts: new Set(['LB', 'ILB', 'OLB', 'MLB']),   flex: false },
  { label: 'DB',   accepts: new Set(['DB', 'S', 'SS', 'FS', 'CB']), flex: false },
  { label: 'DB',   accepts: new Set(['DB', 'S', 'SS', 'FS', 'CB']), flex: false },
  { label: 'DEF',  accepts: new Set(['DEF', 'DST']),                 flex: false },
];

/** Positions used for offense vs defense fallback segregation */
const DEFENSE_POSITIONS = new Set([
  'DL', 'DE', 'DT', 'NT', 'LB', 'ILB', 'OLB', 'MLB',
  'DB', 'S',  'SS', 'FS', 'CB', 'DEF', 'DST',
]);

/** Status badge config */
const STATUS_CONFIG = {
  Q:    { label: 'Q',   className: 'status-q'    },
  D:    { label: 'D',   className: 'status-d'    },
  O:    { label: 'O',   className: 'status-o'    },
  IR:   { label: 'IR',  className: 'status-ir'   },
  SUSP: { label: 'SU',  className: 'status-susp' },
  BYE:  { label: 'BYE', className: 'status-bye'  },
};

/** Rank tier thresholds (per position rank) */
const RANK_TIERS = [
  { max: 12,       className: 'rank-elite' },
  { max: 24,       className: 'rank-good'  },
  { max: 36,       className: 'rank-avg'   },
  { max: Infinity, className: 'rank-low'   },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Normalize a raw player position string to its canonical group.
 * e.g. "SS" → "DB", "ILB" → "LB", "DE" → "DL"
 */
function normalizePos(rawPos = '') {
  const p = rawPos.toUpperCase();
  if (['DE', 'DT', 'NT'].includes(p))              return 'DL';
  if (['ILB', 'OLB', 'MLB'].includes(p))           return 'LB';
  if (['S', 'SS', 'FS', 'CB'].includes(p))         return 'DB';
  if (['DST'].includes(p))                          return 'DEF';
  if (['PK'].includes(p))                           return 'K';
  return p;
}

/**
 * Consume-as-you-assign slot filler.
 *
 * Two-pass algorithm:
 *   Pass 1 — exact match: fill each non-flex slot with the first unassigned
 *             player whose normalized position matches the slot's accepts set.
 *   Pass 2 — flex fill: fill FLEX slots from remaining eligible unassigned players.
 *
 * Returns an array parallel to `slots`, each element a player object or null.
 */
function assignSlots(slots, players) {
  const unassigned = players.map((p, i) => ({ ...p, _idx: i }));
  const result     = new Array(slots.length).fill(null);
  const used       = new Set();

  // Pass 1 — exact (non-flex) slots
  slots.forEach((slot, si) => {
    if (slot.flex) return;
    for (let pi = 0; pi < unassigned.length; pi++) {
      const p = unassigned[pi];
      if (used.has(p._idx)) continue;
      if (slot.accepts.has(normalizePos(p.position))) {
        result[si] = p;
        used.add(p._idx);
        break;
      }
    }
  });

  // Pass 2 — flex slots
  slots.forEach((slot, si) => {
    if (!slot.flex) return;
    for (let pi = 0; pi < unassigned.length; pi++) {
      const p = unassigned[pi];
      if (used.has(p._idx)) continue;
      if (slot.accepts.has(normalizePos(p.position))) {
        result[si] = p;
        used.add(p._idx);
        break;
      }
    }
  });

  return result;
}

/**
 * Get projected points for a player.
 * Priority: modalData.projections.current[player.id] → player.projectedPoints → null
 */
function getProjection(player, projections) {
  if (!player) return null;
  const id = player.id ?? player.playerId;
  if (projections && id !== undefined && projections[id] !== undefined) {
    return projections[id];
  }
  return player.projectedPoints ?? player.projPoints ?? null;
}

/** Format projected points: "12.4" or "—" */
function fmtProj(val) {
  if (val === null || val === undefined) return '—';
  const n = parseFloat(val);
  return isNaN(n) ? '—' : n.toFixed(1);
}

/** Format bye week label or null */
function fmtBye(val) {
  if (!val && val !== 0) return null;
  return `BYE ${val}`;
}

/** Get rank tier CSS class */
function rankClass(rank) {
  if (!rank && rank !== 0) return '';
  const n = parseInt(rank, 10);
  if (isNaN(n)) return '';
  return RANK_TIERS.find(t => n <= t.max)?.className ?? 'rank-low';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Team abbreviation badge — shown while headshot loads or as fallback */
function TeamAbbrevBadge({ abbrev, teamColor }) {
  return (
    <div
      className="team-abbrev-badge"
      style={teamColor ? { backgroundColor: teamColor } : undefined}
      aria-hidden="true"
    >
      {(abbrev || '??').slice(0, 3).toUpperCase()}
    </div>
  );
}

/** Player headshot with fallback to team-abbrev badge */
function HeadshotImg({ player }) {
  const [failed, setFailed] = useState(false);
  const src = player?.headshotUrl ?? player?.imageUrl ?? player?.headshot;

  if (!src || failed) {
    return (
      <TeamAbbrevBadge
        abbrev={player?.proTeamAbbrev ?? player?.team ?? player?.nflTeam}
        teamColor={player?.teamColor ?? player?.teamPrimaryColor}
      />
    );
  }

  return (
    <img
      className="player-headshot"
      src={src}
      alt={player?.fullName ?? player?.name ?? 'Player'}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

/** Rank badge with 4-tier color coding */
function RankBadge({ rank }) {
  if (!rank && rank !== 0) return <span className="rank-badge rank-none">—</span>;
  return (
    <span className={`rank-badge ${rankClass(rank)}`}>
      {rank}
    </span>
  );
}

/** Status badge (Q, D, O, IR, SUSP, BYE) */
function StatusBadge({ status }) {
  if (!status) return null;
  const cfg = STATUS_CONFIG[status.toUpperCase()] ?? { label: status, className: 'status-other' };
  return <span className={`status-badge ${cfg.className}`}>{cfg.label}</span>;
}

/** Section label row with color-coded left border via CSS custom property */
function SectionLabel({ label, colorVar }) {
  return (
    <div className="section-label" style={{ '--section-color': `var(${colorVar})` }}>
      {label}
    </div>
  );
}

/** Empty slot tile */
function EmptySlot({ posLabel }) {
  return (
    <div className="player-tile player-tile--empty" aria-label={`Empty ${posLabel} slot`}>
      <span className="tile-pos-label">{posLabel}</span>
      <span className="tile-player-col">
        <span className="empty-slot-text">Empty</span>
      </span>
      <span className="tile-rank-col">—</span>
      <span className="tile-proj-col">—</span>
    </div>
  );
}

/** Compact player tile — Yahoo style */
function PlayerTile({ slotLabel, player, projection, onPlayerClick }) {
  const handleClick = useCallback(() => {
    if (player && onPlayerClick) onPlayerClick(player);
  }, [player, onPlayerClick]);

  const handleKeyDown = useCallback((e) => {
    if ((e.key === 'Enter' || e.key === ' ') && player && onPlayerClick) {
      e.preventDefault();
      onPlayerClick(player);
    }
  }, [player, onPlayerClick]);

  const byeText    = fmtBye(player?.byeWeek ?? player?.bye);
  const playerName = player?.fullName ?? player?.name ?? 'Unknown';
  const teamAbbrev = (player?.proTeamAbbrev ?? player?.team ?? player?.nflTeam ?? '').toUpperCase();
  const rank       = player?.positionRank ?? player?.rank ?? player?.overallRank;
  const status     = player?.injuryStatus ?? player?.status;
  const posDisplay = player?.position ? normalizePos(player.position) : slotLabel;

  return (
    <div
      className="player-tile"
      role="button"
      tabIndex={0}
      aria-label={`${playerName}, ${posDisplay}, rank ${rank ?? 'N/A'}, projected ${fmtProj(projection)}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* POS column */}
      <span className="tile-pos-label">{slotLabel}</span>

      {/* Player column */}
      <span className="tile-player-col">
        <span className="tile-headshot-wrap">
          <HeadshotImg player={player} />
        </span>
        <span className="tile-player-info">
          <span className="tile-player-name">{playerName}</span>
          <span className="tile-player-meta">
            {teamAbbrev && <span className="tile-team-abbrev">{teamAbbrev}</span>}
            {posDisplay  && <span className="tile-pos-small">{posDisplay}</span>}
            {byeText     && <span className="tile-bye">{byeText}</span>}
            <StatusBadge status={status} />
          </span>
        </span>
      </span>

      {/* Rank column */}
      <span className="tile-rank-col">
        <RankBadge rank={rank} />
      </span>

      {/* Proj column */}
      <span className="tile-proj-col">
        <span className="proj-value">{fmtProj(projection)}</span>
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * Team
 *
 * Props:
 *   roster        {Array}    — flat array of player objects on this team's roster
 *   modalData     {Object}   — app-level modal context; must include:
 *                               modalData.projections.current  {Object<playerId, number>}
 *   onPlayerClick {Function} — receives a player object and opens the detail modal
 *
 * Player object consumed fields:
 *   id / playerId            — unique identifier (for projection lookup)
 *   fullName / name          — display name
 *   position                 — raw NFL position string ("WR", "SS", "DE", etc.)
 *   rosterSlot / lineupSlot  — "offense" | "defense" | "bench" | "ir" (case-insensitive)
 *   positionRank / rank / overallRank
 *   projectedPoints / projPoints
 *   byeWeek / bye
 *   injuryStatus / status    — "Q" | "D" | "O" | "IR" | "SUSP" | "BYE"
 *   headshotUrl / imageUrl / headshot
 *   proTeamAbbrev / team / nflTeam
 *   teamColor / teamPrimaryColor
 */
export default function Team({ roster = [], modalData = {}, onPlayerClick }) {

  // ── Segment roster by slot designation ──────────────────────────────────────
  const { offensePlayers, defensePlayers, benchPlayers, irPlayers } = useMemo(() => {
    const offensePlayers = [];
    const defensePlayers = [];
    const benchPlayers   = [];
    const irPlayers      = [];

    roster.forEach(player => {
      const slot = (player.rosterSlot ?? player.lineupSlot ?? '').toLowerCase();
      if (slot === 'ir' || slot === 'injured_reserve') {
        irPlayers.push(player);
      } else if (slot === 'bench' || slot === 'bn') {
        benchPlayers.push(player);
      } else if (slot === 'defense' || slot === 'def') {
        defensePlayers.push(player);
      } else if (slot === 'offense' || slot === 'off') {
        offensePlayers.push(player);
      } else {
        // Fallback: infer from position
        if (DEFENSE_POSITIONS.has(normalizePos(player.position))) {
          defensePlayers.push(player);
        } else {
          offensePlayers.push(player);
        }
      }
    });

    return { offensePlayers, defensePlayers, benchPlayers, irPlayers };
  }, [roster]);

  // ── Consume-as-you-assign slot filling ──────────────────────────────────────
  const filledOffenseSlots = useMemo(
    () => assignSlots(OFFENSE_SLOTS, offensePlayers),
    [offensePlayers],
  );
  const filledDefenseSlots = useMemo(
    () => assignSlots(DEFENSE_SLOTS, defensePlayers),
    [defensePlayers],
  );

  // ── Projection lookup ────────────────────────────────────────────────────────
  const projections = modalData?.projections?.current ?? {};
  const proj = useCallback(
    (player) => getProjection(player, projections),
    [projections],
  );

  // ── Starter projected total ──────────────────────────────────────────────────
  const totalProj = useMemo(() => {
    const starters = [...filledOffenseSlots, ...filledDefenseSlots].filter(Boolean);
    const sum = starters.reduce((acc, p) => {
      const v = parseFloat(getProjection(p, projections));
      return acc + (isNaN(v) ? 0 : v);
    }, 0);
    return sum > 0 ? sum.toFixed(1) : null;
  }, [filledOffenseSlots, filledDefenseSlots, projections]);

  // ── Render helper: slotted section (offense / defense) ──────────────────────
  const renderFilledSection = (slots, filledSlots) =>
    slots.map((slot, i) => {
      const player = filledSlots[i];
      return player
        ? <PlayerTile
            key={`${slot.label}-${i}-${player.id ?? player.playerId ?? i}`}
            slotLabel={slot.label}
            player={player}
            projection={proj(player)}
            onPlayerClick={onPlayerClick}
          />
        : <EmptySlot key={`empty-${slot.label}-${i}`} posLabel={slot.label} />;
    });

  // ── Render helper: free section (bench / IR — raw position label) ────────────
  const renderFreeSection = (players, fallbackLabel) =>
    players.length === 0
      ? <EmptySlot posLabel={fallbackLabel} />
      : players.map((player, i) => (
          <PlayerTile
            key={`${fallbackLabel}-${i}-${player.id ?? player.playerId ?? i}`}
            slotLabel={normalizePos(player.position) || fallbackLabel}
            player={player}
            projection={proj(player)}
            onPlayerClick={onPlayerClick}
          />
        ));

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="team-view" role="region" aria-label="Team roster">

      {/* Sticky header */}
      <div className="team-header" role="row" aria-label="Column headers">
        <span className="header-pos">POS</span>
        <span className="header-player">Player</span>
        <span className="header-rank">Rank</span>
        <span className="header-proj">
          Proj
          {totalProj && (
            <span className="header-proj-total" aria-label={`Total projected ${totalProj}`}>
              {totalProj}
            </span>
          )}
        </span>
      </div>

      {/* Offense */}
      <SectionLabel label="Offense" colorVar="--color-offense" />
      <div className="roster-section roster-section--offense" role="list">
        {renderFilledSection(OFFENSE_SLOTS, filledOffenseSlots)}
      </div>

      {/* Defense */}
      <SectionLabel label="Defense" colorVar="--color-defense" />
      <div className="roster-section roster-section--defense" role="list">
        {renderFilledSection(DEFENSE_SLOTS, filledDefenseSlots)}
      </div>

      {/* Bench */}
      <SectionLabel label="Bench" colorVar="--color-bench" />
      <div className="roster-section roster-section--bench" role="list">
        {renderFreeSection(benchPlayers, 'BN')}
      </div>

      {/* IR (only rendered when populated) */}
      {irPlayers.length > 0 && (
        <>
          <SectionLabel label="IR" colorVar="--color-ir" />
          <div className="roster-section roster-section--ir" role="list">
            {renderFreeSection(irPlayers, 'IR')}
          </div>
        </>
      )}

    </div>
  );
}


