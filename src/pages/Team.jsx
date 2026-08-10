import React, { useState, useEffect, useCallback } from "react";
import "./team.css";

// ─── Column layout (shared between sticky header and roster rows) ─────────────
// Slot | Player | Opp | Proj | Actual | Status
// Using explicit widths so header and body columns stay perfectly aligned.
const COL_SLOT    = "60px";
const COL_PLAYER  = "1fr";
const COL_OPP     = "100px";
const COL_PROJ    = "72px";
const COL_ACTUAL  = "72px";
const COL_STATUS  = "64px";

const GRID_COLS = `${COL_SLOT} ${COL_PLAYER} ${COL_OPP} ${COL_PROJ} ${COL_ACTUAL} ${COL_STATUS}`;

// ─── Helper: look up opponent abbreviation from schedule data ─────────────────
function getOpponentDisplay(playerData, weekSchedule) {
  if (!playerData || !weekSchedule) return "BYE";
  const teamAbbr = playerData.proTeamId
    ? weekSchedule.teamMap?.[playerData.proTeamId]
    : null;
  if (!teamAbbr) return "BYE";
  const game = weekSchedule.games?.find(
    (g) => g.home === teamAbbr || g.away === teamAbbr
  );
  if (!game) return "BYE";
  const isHome = game.home === teamAbbr;
  const opp = isHome ? game.away : game.home;
  return isHome ? `vs ${opp}` : `@ ${opp}`;
}

// ─── Helper: derive projected points from API payload ────────────────────────
function extractProjected(playerEntry) {
  return (
    playerEntry?.playerPoolEntry?.appliedStatTotal ??
    playerEntry?.projectedPoints ??
    playerEntry?.playerPoolEntry?.player?.stats?.find?.(
      (s) => s.statSourceId === 1
    )?.appliedTotal ??
    null
  );
}

// ─── Helper: derive actual points ────────────────────────────────────────────
function extractActual(playerEntry) {
  return (
    playerEntry?.playerPoolEntry?.appliedStatTotal ??
    playerEntry?.actualPoints ??
    playerEntry?.playerPoolEntry?.player?.stats?.find?.(
      (s) => s.statSourceId === 0
    )?.appliedTotal ??
    null
  );
}

// ─── loadRoster: transforms raw API roster into display-ready array ───────────
function loadRoster(rawRoster, weekSchedule) {
  if (!Array.isArray(rawRoster)) return [];

  return rawRoster.map((entry) => {
    const player = entry?.playerPoolEntry?.player ?? {};
    const fullName = player.fullName ?? "Unknown";
    const injuryStatus = player.injuryStatus ?? null;

    // ── Projected & actual points assignment ──────────────────────────────
    const projectedPoints = extractProjected(entry);
    const actualPoints    = extractActual(entry);

    // ── Matchup / opponent display ────────────────────────────────────────
    const opponentDisplay = getOpponentDisplay(player, weekSchedule);

    return {
      slotId:          entry.lineupSlotId,
      playerId:        player.id ?? null,
      name:            fullName,
      proTeamId:       player.proTeamId ?? null,
      position:        player.defaultPositionId ?? null,
      injuryStatus,
      projectedPoints,
      actualPoints,
      opponentDisplay,
    };
  });
}

// ─── Slot ID → label map (ESPN slot IDs) ─────────────────────────────────────
const SLOT_LABELS = {
  0:  "QB",
  2:  "RB",
  4:  "WR",
  6:  "TE",
  16: "DST",
  17: "K",
  20: "BE",
  21: "IR",
  23: "FLEX",
};

function slotLabel(slotId) {
  return SLOT_LABELS[slotId] ?? `S${slotId}`;
}

// ─── Injury status badge ──────────────────────────────────────────────────────
function InjuryBadge({ status }) {
  if (!status || status === "ACTIVE") return null;
  const map = {
    QUESTIONABLE: { label: "Q",   cls: "badge--q"   },
    DOUBTFUL:     { label: "D",   cls: "badge--d"   },
    OUT:          { label: "O",   cls: "badge--out"  },
    IR:           { label: "IR",  cls: "badge--ir"   },
    SUSPENSION:   { label: "SUS", cls: "badge--sus"  },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "badge--q" };
  return <span className={`injury-badge ${cls}`}>{label}</span>;
}

// ─── Points display ───────────────────────────────────────────────────────────
function Pts({ value }) {
  if (value === null || value === undefined)
    return <span className="pts pts--empty">–</span>;
  return <span className="pts">{Number(value).toFixed(1)}</span>;
}

// ─── Single roster row ────────────────────────────────────────────────────────
function RosterRow({ player, gridCols }) {
  const isBench = player.slotId === 20;
  const isIR    = player.slotId === 21;
  return (
    <div
      className={[
        "team-row",
        isBench ? "team-row--bench" : "",
        isIR    ? "team-row--ir"    : "",
      ].filter(Boolean).join(" ")}
      style={{ gridTemplateColumns: gridCols }}
    >
      <span className="col-slot">{slotLabel(player.slotId)}</span>

      <span className="col-player">
        <span className="player-name">{player.name}</span>
        <InjuryBadge status={player.injuryStatus} />
      </span>

      <span className="col-opp">{player.opponentDisplay}</span>

      <span className="col-proj">
        <Pts value={player.projectedPoints} />
      </span>

      <span className="col-actual">
        <Pts value={player.actualPoints} />
      </span>

      <span className="col-status">
        <InjuryBadge status={player.injuryStatus} />
      </span>
    </div>
  );
}

// ─── Sticky column header ─────────────────────────────────────────────────────
function RosterHeader({ gridCols }) {
  return (
    <div className="team-header" style={{ gridTemplateColumns: gridCols }}>
      <span className="col-slot">SLOT</span>
      <span className="col-player">PLAYER</span>
      <span className="col-opp">OPP</span>
      <span className="col-proj">PROJ</span>
      <span className="col-actual">PTS</span>
      <span className="col-status">STATUS</span>
    </div>
  );
}

// ─── Section divider ──────────────────────────────────────────────────────────
function SectionLabel({ label }) {
  return <div className="section-label">{label}</div>;
}

// ─── Main Team component ──────────────────────────────────────────────────────
export default function Team({
  leagueId,
  teamId,
  seasonId,
  scoringPeriodId,
  fetchRoster,    // async (leagueId, teamId, seasonId, scoringPeriodId) => rawRoster[]
  fetchSchedule,  // async (leagueId, seasonId, scoringPeriodId) => weekSchedule
  teamMeta,       // { teamName, ownerName, logoUrl, record }
}) {
  const [roster, setRoster]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [matchupInfo, setMatchupInfo] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rawRoster, weekSchedule] = await Promise.all([
        fetchRoster(leagueId, teamId, seasonId, scoringPeriodId),
        fetchSchedule(leagueId, seasonId, scoringPeriodId),
      ]);

      // projected points + opponentDisplay assigned inside loadRoster
      const processed = loadRoster(rawRoster, weekSchedule);
      setRoster(processed);

      // ── Matchup display ───────────────────────────────────────────────
      const matchup = weekSchedule?.matchups?.find(
        (m) => m.homeTeamId === teamId || m.awayTeamId === teamId
      );
      if (matchup) {
        const isHome  = matchup.homeTeamId === teamId;
        const oppId   = isHome ? matchup.awayTeamId : matchup.homeTeamId;
        const oppMeta = weekSchedule?.teamMetas?.[oppId] ?? {};
        setMatchupInfo({
          isHome,
          oppName:           oppMeta.teamName  ?? `Team ${oppId}`,
          oppOwner:          oppMeta.ownerName ?? "",
          oppProjectedScore: isHome
            ? matchup.awayProjectedScore
            : matchup.homeProjectedScore,
        });
      }
    } catch (err) {
      setError(err.message ?? "Failed to load roster.");
    } finally {
      setLoading(false);
    }
  }, [leagueId, teamId, seasonId, scoringPeriodId, fetchRoster, fetchSchedule]);

  useEffect(() => { load(); }, [load]);

  const starters = roster.filter((p) => p.slotId !== 20 && p.slotId !== 21);
  const bench    = roster.filter((p) => p.slotId === 20);
  const ir       = roster.filter((p) => p.slotId === 21);

  const totalProjected = starters.reduce((s, p) => s + (p.projectedPoints ?? 0), 0);
  const totalActual    = starters.reduce((s, p) => s + (p.actualPoints    ?? 0), 0);

  if (loading) return <div className="team-loading">Loading roster…</div>;
  if (error)   return <div className="team-error">Error: {error}</div>;

  return (
    <div className="team-container">

      {/* Team card */}
      <div className="team-card">
        {teamMeta?.logoUrl && (
          <img className="team-logo" src={teamMeta.logoUrl}
               alt={`${teamMeta.teamName} logo`} />
        )}
        <div className="team-info">
          <h2 className="team-name">{teamMeta?.teamName ?? `Team ${teamId}`}</h2>
          {teamMeta?.ownerName && <span className="team-owner">{teamMeta.ownerName}</span>}
          {teamMeta?.record    && <span className="team-record">{teamMeta.record}</span>}
        </div>
      </div>

      {/* Matchup banner */}
      {matchupInfo && (
        <div className="matchup-banner">
          <div className="matchup-side matchup-side--mine">
            <span className="matchup-team">{teamMeta?.teamName ?? "My Team"}</span>
            <span className="matchup-proj">Proj: <strong>{totalProjected.toFixed(1)}</strong></span>
            <span className="matchup-actual">Pts: <strong>{totalActual.toFixed(1)}</strong></span>
          </div>
          <div className="matchup-vs">{matchupInfo.isHome ? "vs" : "@"}</div>
          <div className="matchup-side matchup-side--opp">
            <span className="matchup-team">{matchupInfo.oppName}</span>
            {matchupInfo.oppOwner && <span className="matchup-owner">{matchupInfo.oppOwner}</span>}
            {matchupInfo.oppProjectedScore != null && (
              <span className="matchup-proj">
                Proj: <strong>{Number(matchupInfo.oppProjectedScore).toFixed(1)}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Roster table */}
      <div className="roster-table">

        {/* Sticky header — gridTemplateColumns matches every team-row */}
        <RosterHeader gridCols={GRID_COLS} />

        <SectionLabel label="Starters" />
        {starters.map((player, i) => (
          <RosterRow key={`starter-${player.playerId ?? i}`}
                     player={player} gridCols={GRID_COLS} />
        ))}

        {/* Totals row */}
        <div className="team-row team-row--totals"
             style={{ gridTemplateColumns: GRID_COLS }}>
          <span className="col-slot" />
          <span className="col-player totals-label">TOTAL</span>
          <span className="col-opp" />
          <span className="col-proj"><Pts value={totalProjected} /></span>
          <span className="col-actual"><Pts value={totalActual} /></span>
          <span className="col-status" />
        </div>

        {bench.length > 0 && (
          <>
            <SectionLabel label="Bench" />
            {bench.map((player, i) => (
              <RosterRow key={`bench-${player.playerId ?? i}`}
                         player={player} gridCols={GRID_COLS} />
            ))}
          </>
        )}

        {ir.length > 0 && (
          <>
            <SectionLabel label="Injured Reserve" />
            {ir.map((player, i) => (
              <RosterRow key={`ir-${player.playerId ?? i}`}
                         player={player} gridCols={GRID_COLS} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
