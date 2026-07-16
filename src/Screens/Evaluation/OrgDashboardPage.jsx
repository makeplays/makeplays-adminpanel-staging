import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchEvaluationCycles, fetchEvaluationReviewDashboard } from "../../api/evaluationApi";
import { EvaluationShell } from "./EvaluationShell";
import { getOutcomeBadgeClass } from "./evaluationHelpers";
import { useEvaluationWorkspace } from "./useEvaluationWorkspace";

const TotalsCard = ({ label, value, hint }) => (
    <div className="evaluation-summaryCard">
        <p className="evaluation-summaryCard__label">{label}</p>
        <p className="evaluation-summaryCard__value">{value}</p>
        <p className="evaluation-summaryCard__hint">{hint}</p>
    </div>
);

export const OrgDashboardPage = () => {
    const workspace = useEvaluationWorkspace();
    const [cycles, setCycles] = useState([]);
    const [dashboardData, setDashboardData] = useState(null);
    const [searchValue, setSearchValue] = useState("");
    const [outcomeFilter, setOutcomeFilter] = useState("all");
    const [sortKey, setSortKey] = useState("weighted-desc");

    useEffect(() => {
        if (!workspace?.selectedTeamId) {
            return;
        }

        const loadCycles = async () => {
            const response = await fetchEvaluationCycles(workspace.selectedTeamId);
            if (response?.status) {
                const nextCycles = response?.cycles || [];
                setCycles(nextCycles);
                if (!workspace?.selectedCycleId && nextCycles?.[0]?._id) {
                    workspace.setSelectedCycle(nextCycles[0]._id);
                }
            }
        };

        loadCycles();
    }, [workspace?.selectedTeamId]);

    useEffect(() => {
        if (!workspace?.selectedCycleId) {
            setDashboardData(null);
            return;
        }

        const loadDashboard = async () => {
            const response = await fetchEvaluationReviewDashboard(workspace.selectedCycleId);
            if (response?.status) {
                setDashboardData(response);
            }
        };

        loadDashboard();
    }, [workspace?.selectedCycleId]);

    const filteredPlayers = useMemo(() => {
        const players = [...(dashboardData?.players || [])];
        const searchLower = searchValue.trim().toLowerCase();

        const nextPlayers = players.filter((player) => {
            const matchesSearch = !searchLower || player?.displayName?.toLowerCase()?.includes(searchLower)
                || player?.position?.toLowerCase()?.includes(searchLower)
                || String(player?.number || "").toLowerCase().includes(searchLower);
            const matchesOutcome = outcomeFilter === "all" || player?.outcome?.finalState === outcomeFilter;
            return matchesSearch && matchesOutcome;
        });

        return nextPlayers.sort((left, right) => {
            if (sortKey === "weighted-asc") {
                return Number(left?.aggregate?.weightedAverage || 0) - Number(right?.aggregate?.weightedAverage || 0);
            }
            if (sortKey === "name-asc") {
                return String(left?.displayName || "").localeCompare(String(right?.displayName || ""));
            }
            if (sortKey === "name-desc") {
                return String(right?.displayName || "").localeCompare(String(left?.displayName || ""));
            }
            return Number(right?.aggregate?.weightedAverage || 0) - Number(left?.aggregate?.weightedAverage || 0);
        });
    }, [dashboardData?.players, outcomeFilter, searchValue, sortKey]);

    return (
        <EvaluationShell
            workspace={workspace}
            title="Org Dashboard"
            description="Review cycle totals, manage the player queue, and move into individual player review with clear filters, sorting, and search."
        >
            <div className="evaluation-card">
                <div className="evaluation-formGrid">
                    <div className="evaluation-field">
                        <label>Cycle</label>
                        <select value={workspace?.selectedCycleId} onChange={(event) => workspace.setSelectedCycle(event.target.value)}>
                            <option value="">Select cycle</option>
                            {cycles.map((cycle) => (
                                <option key={cycle?._id} value={cycle?._id}>
                                    {cycle?.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="evaluation-field">
                        <label>Search</label>
                        <input
                            type="text"
                            value={searchValue}
                            onChange={(event) => setSearchValue(event.target.value)}
                            placeholder="Find by player, number, or position"
                        />
                    </div>
                    <div className="evaluation-field">
                        <label>Outcome filter</label>
                        <select value={outcomeFilter} onChange={(event) => setOutcomeFilter(event.target.value)}>
                            <option value="all">All states</option>
                            <option value="assigned">Assigned</option>
                            <option value="pending_review">Pending review</option>
                            <option value="waitlisted">Waitlisted</option>
                            <option value="redirected">Redirected</option>
                            <option value="not_selected">Not selected</option>
                            <option value="withdrawn">Withdrawn</option>
                        </select>
                    </div>
                    <div className="evaluation-field">
                        <label>Sort</label>
                        <select value={sortKey} onChange={(event) => setSortKey(event.target.value)}>
                            <option value="weighted-desc">Weighted average high to low</option>
                            <option value="weighted-asc">Weighted average low to high</option>
                            <option value="name-asc">Name A-Z</option>
                            <option value="name-desc">Name Z-A</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="evaluation-summaryGrid">
                <TotalsCard label="Players" value={dashboardData?.totals?.playerCount || 0} hint="Roster entries in this cycle." />
                <TotalsCard label="Sessions" value={dashboardData?.totals?.sessionCount || 0} hint="Cycle sessions created so far." />
                <TotalsCard label="Observations" value={dashboardData?.totals?.observationCount || 0} hint="Submitted evaluator observations." />
                <TotalsCard label="Review queue" value={dashboardData?.totals?.reviewQueueCount || 0} hint="Players still pending org final review." />
                <TotalsCard label="Released to parents" value={dashboardData?.totals?.releasedToParentsCount || 0} hint="Official parent-safe outcomes already released." />
                <TotalsCard label="Roster handoffs" value={dashboardData?.handoff?.rosterReady || 0} hint="Players moved into roster handoff readiness." />
            </div>

            {(dashboardData?.totals?.reviewQueueCount || 0) > 0 ? (
                <div className="alert alert-warning">
                    {dashboardData?.totals?.reviewQueueCount || 0} players are still waiting for an org authority decision or finalization.
                </div>
            ) : null}

            <div className="evaluation-card">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <p className="evaluation-card__eyebrow">Player review queue</p>
                        <h3>Cycle rollup</h3>
                    </div>
                    <span className="evaluation-meta">{filteredPlayers.length} shown</span>
                </div>
                <div className="evaluation-tableWrap">
                    <table className="evaluation-table">
                        <thead>
                            <tr>
                                <th>Player</th>
                                <th>Weighted average</th>
                                <th>Observations</th>
                                <th>Evaluators</th>
                                <th>Outcome</th>
                                <th>Release</th>
                                <th>Handoff</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPlayers.length ? filteredPlayers.map((player) => (
                                <tr key={player?.playerMemberId}>
                                    <td>
                                        <strong>{player?.displayName || "Player"}</strong>
                                        <small className="d-block text-muted">
                                            {player?.position || "Position --"} • #{player?.number || "--"}
                                        </small>
                                    </td>
                                    <td>{Number(player?.aggregate?.weightedAverage || 0).toFixed(2)}</td>
                                    <td>{player?.aggregate?.observationCount || 0}</td>
                                    <td>{player?.aggregate?.evaluatorCount || 0}</td>
                                    <td>
                                        <span className={`badge bg-${getOutcomeBadgeClass(player?.outcome?.finalState)}`}>
                                            {player?.outcome?.finalState || "pending_review"}
                                        </span>
                                    </td>
                                    <td>{player?.outcome?.releasedToParentsAt ? "Released" : "Not released"}</td>
                                    <td>
                                        R: {player?.outcome?.handoff?.roster || "pending"} / S: {player?.outcome?.handoff?.schedule || "pending"} / D: {player?.outcome?.handoff?.dj || "pending"}
                                    </td>
                                    <td>
                                        <Link
                                            className="evaluation-inlineLink"
                                            to={workspace.buildRoute(`/sports-evaluation/player/${player?.playerMemberId}`, { cycleId: workspace?.selectedCycleId })}
                                        >
                                            Review
                                        </Link>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="8">
                                        <div className="evaluation-emptyState">No players match the current filters.</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </EvaluationShell>
    );
};

export default OrgDashboardPage;
