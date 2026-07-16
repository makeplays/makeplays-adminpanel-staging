import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
    createEvaluationOutcome,
    fetchEvaluationAssignmentsBySession,
    fetchEvaluationPlayerReview,
    fetchEvaluationSessions,
    finalizeEvaluationOutcome,
    releaseEvaluationOutcomeToParents,
    updateEvaluationOutcomeHandoff
} from "../../api/evaluationApi";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import { EvaluationShell } from "./EvaluationShell";
import {
    HANDOFF_STATUS_OPTIONS,
    OUTCOME_STATE_OPTIONS,
    formatDateTimeLabel,
    getParentSafePreview
} from "./evaluationHelpers";
import { useEvaluationWorkspace } from "./useEvaluationWorkspace";

const createOutcomeDraft = () => ({
    _id: "",
    finalState: "pending_review",
    publicNote: "",
    internalDecisionNote: "",
    finalizedAt: null,
    releasedToParentsAt: null,
    handoff: {
        roster: "pending",
        schedule: "pending",
        dj: "pending"
    }
});

export const PlayerReviewPage = () => {
    const { playerMemberId } = useParams();
    const workspace = useEvaluationWorkspace();
    const authData = useSelector((state) => state.isRun);
    const [reviewData, setReviewData] = useState(null);
    const [outcomeDraft, setOutcomeDraft] = useState(createOutcomeDraft());
    const [authorityMode, setAuthorityMode] = useState("checking");

    const loadAuthorityMode = async () => {
        if (!workspace?.selectedCycleId || !authData?.userId) {
            setAuthorityMode("unknown");
            return;
        }

        const sessionsResponse = await fetchEvaluationSessions(workspace.selectedCycleId);
        if (!sessionsResponse?.status) {
            setAuthorityMode("unknown");
            return;
        }

        const sessionIds = (sessionsResponse?.sessions || []).map((session) => session?._id).filter(Boolean);
        const assignmentResponses = await Promise.all(sessionIds.map((sessionId) => fetchEvaluationAssignmentsBySession(sessionId)));
        if (assignmentResponses.some((response) => !response?.status)) {
            setAuthorityMode("unknown");
            return;
        }

        const isAssignedEvaluator = assignmentResponses.some((response) =>
            (response?.assignments || []).some((assignment) => {
                const evaluatorId = assignment?.evaluatorUserId?._id || assignment?.evaluatorUserId;
                return evaluatorId === authData.userId
                    && ["lead", "evaluator"].includes(assignment?.role)
                    && assignment?.status !== "revoked";
            })
        );

        setAuthorityMode(isAssignedEvaluator ? "blocked" : "clear");
    };

    const loadReview = async () => {
        if (!workspace?.selectedCycleId || !playerMemberId) {
            return;
        }

        const response = await fetchEvaluationPlayerReview(workspace.selectedCycleId, playerMemberId);
        if (response?.status) {
            setReviewData(response);
            setOutcomeDraft({
                ...createOutcomeDraft(),
                ...(response?.outcome || {})
            });
        }
    };

    useEffect(() => {
        setAuthorityMode("checking");
        loadReview();
        loadAuthorityMode();
    }, [authData?.userId, playerMemberId, workspace?.selectedCycleId]);

    const parentPreview = useMemo(() => {
        return getParentSafePreview(outcomeDraft?.finalState, outcomeDraft?.publicNote);
    }, [outcomeDraft?.finalState, outcomeDraft?.publicNote]);

    const controlsBlocked = authorityMode === "blocked" || authorityMode === "unknown";
    const outcomeId = outcomeDraft?._id;
    const canOperateHandoffs = Boolean(outcomeDraft?.finalizedAt)
        && !["pending_review", "not_selected", "withdrawn"].includes(outcomeDraft?.finalState);

    const refreshAll = async () => {
        await loadReview();
        await loadAuthorityMode();
    };

    const handleSaveOutcome = async () => {
        if (controlsBlocked) {
            return;
        }

        const response = await createEvaluationOutcome({
            teamId: workspace.selectedTeamId,
            cycleId: workspace.selectedCycleId,
            playerMemberId,
            finalState: outcomeDraft.finalState,
            publicNote: outcomeDraft.publicNote,
            internalDecisionNote: outcomeDraft.internalDecisionNote
        });

        if (response?.status) {
            CustomToastHandler({ msg: response?.message || "Outcome saved." });
            await refreshAll();
            return;
        }

        CustomToastHandler({
            msg: response?.message || "Unable to save the outcome.",
            type: "error"
        });
    };

    const handleFinalize = async () => {
        if (!outcomeId || controlsBlocked) {
            return;
        }

        const response = await finalizeEvaluationOutcome(outcomeId, {
            finalState: outcomeDraft.finalState,
            publicNote: outcomeDraft.publicNote,
            internalDecisionNote: outcomeDraft.internalDecisionNote
        });

        if (response?.status) {
            CustomToastHandler({ msg: response?.message || "Outcome finalized." });
            await refreshAll();
            return;
        }

        CustomToastHandler({
            msg: response?.message || "Unable to finalize the outcome.",
            type: "error"
        });
    };

    const handleRelease = async () => {
        if (!outcomeId || controlsBlocked) {
            return;
        }

        const response = await releaseEvaluationOutcomeToParents(outcomeId);
        if (response?.status) {
            CustomToastHandler({ msg: response?.message || "Outcome released to parents." });
            await refreshAll();
            return;
        }

        CustomToastHandler({
            msg: response?.message || "Unable to release the parent-safe outcome.",
            type: "error"
        });
    };

    const handleHandoffUpdate = async (handoffType, status) => {
        if (!outcomeId || controlsBlocked) {
            return;
        }

        const response = await updateEvaluationOutcomeHandoff(outcomeId, {
            handoffType,
            status
        });

        if (response?.status) {
            CustomToastHandler({ msg: response?.message || `${handoffType} handoff updated.` });
            await refreshAll();
            return;
        }

        CustomToastHandler({
            msg: response?.message || `Unable to update ${handoffType} handoff.`,
            type: "error"
        });
    };

    return (
        <EvaluationShell
            workspace={workspace}
            title="Player Review"
            description="Review the cycle rollup, evaluator spread, session history, and org-only decision notes before finalizing or releasing a parent-safe update."
        >
            <div className="evaluation-banner">
                <div>
                    <p className="evaluation-banner__title">{reviewData?.player?.displayName || "Player review"}</p>
                    <p className="evaluation-banner__copy">
                        #{reviewData?.player?.number || "--"} • {reviewData?.player?.position || "Position not set"} • cycle {reviewData?.cycle?.name || "--"}
                    </p>
                </div>
                <Link className="evaluation-inlineLink" to={workspace.buildRoute("/sports-evaluation/dashboard")}>
                    Back to org dashboard
                </Link>
            </div>

            {authorityMode === "blocked" ? (
                <div className="alert alert-warning">
                    This signed-in user is assigned as a scoring evaluator in the current cycle, so finalize, release, and handoff controls are hidden to keep org authority separate.
                </div>
            ) : null}

            {authorityMode === "unknown" ? (
                <div className="alert alert-warning">
                    Role-conflict status could not be verified safely, so finalize, release, and handoff controls are disabled until session assignments can be confirmed.
                </div>
            ) : null}

            <div className="evaluation-summaryGrid">
                <div className="evaluation-summaryCard">
                    <p className="evaluation-summaryCard__label">Weighted average</p>
                    <p className="evaluation-summaryCard__value">{Number(reviewData?.cycleRollup?.weightedAverage || 0).toFixed(2)}</p>
                    <p className="evaluation-summaryCard__hint">Cycle aggregate snapshot.</p>
                </div>
                <div className="evaluation-summaryCard">
                    <p className="evaluation-summaryCard__label">Observations</p>
                    <p className="evaluation-summaryCard__value">{reviewData?.cycleRollup?.observationCount || 0}</p>
                    <p className="evaluation-summaryCard__hint">Submitted evaluator observations.</p>
                </div>
                <div className="evaluation-summaryCard">
                    <p className="evaluation-summaryCard__label">Evaluators</p>
                    <p className="evaluation-summaryCard__value">{reviewData?.evaluatorSpread?.evaluatorCount || 0}</p>
                    <p className="evaluation-summaryCard__hint">Distinct scoring staff in this cycle.</p>
                </div>
                <div className="evaluation-summaryCard">
                    <p className="evaluation-summaryCard__label">Outcome state</p>
                    <p className="evaluation-summaryCard__value">{outcomeDraft?.finalState || "pending_review"}</p>
                    <p className="evaluation-summaryCard__hint">
                        {outcomeDraft?.releasedToParentsAt ? "Parent-safe update released." : "Not released to parents yet."}
                    </p>
                </div>
            </div>

            <div className="evaluation-cardRow">
                <div className="evaluation-card evaluation-card--wide">
                    <p className="evaluation-card__eyebrow">Outcome panel</p>
                    <h3>Org-only decision controls</h3>

                    <div className="evaluation-formGrid">
                        <div className="evaluation-field">
                            <label>Final state</label>
                            <select
                                value={outcomeDraft.finalState}
                                onChange={(event) => setOutcomeDraft((current) => ({ ...current, finalState: event.target.value }))}
                            >
                                {OUTCOME_STATE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="evaluation-field">
                            <label>Release state</label>
                            <div className="evaluation-miniPanel__meta">
                                {outcomeDraft?.releasedToParentsAt ? `Released ${formatDateTimeLabel(outcomeDraft.releasedToParentsAt)}` : "Not released to parents"}
                            </div>
                            <div className="evaluation-miniPanel__meta">
                                {outcomeDraft?.finalizedAt ? `Finalized ${formatDateTimeLabel(outcomeDraft.finalizedAt)}` : "Not finalized yet"}
                            </div>
                        </div>
                    </div>

                    <div className="evaluation-field mt-3">
                        <label>Public note</label>
                        <textarea
                            rows="4"
                            value={outcomeDraft.publicNote}
                            onChange={(event) => setOutcomeDraft((current) => ({ ...current, publicNote: event.target.value }))}
                            placeholder="Parent-safe summary only. Do not explain why a player was not chosen."
                        />
                    </div>

                    <div className="evaluation-field mt-3">
                        <label>Internal decision note</label>
                        <textarea
                            rows="4"
                            value={outcomeDraft.internalDecisionNote}
                            onChange={(event) => setOutcomeDraft((current) => ({ ...current, internalDecisionNote: event.target.value }))}
                            placeholder="Org-only note for decision support. Never released to parents."
                        />
                    </div>

                    {!controlsBlocked ? (
                        <div className="evaluation-actionRow">
                            <button type="button" className="orange_small_primary" onClick={handleSaveOutcome}>
                                Save outcome
                            </button>
                            <button type="button" className="evaluation-secondaryBtn" onClick={handleFinalize} disabled={!outcomeId}>
                                Finalize
                            </button>
                            <button type="button" className="evaluation-secondaryBtn" onClick={handleRelease} disabled={!outcomeId || !outcomeDraft?.finalizedAt}>
                                Release to parents
                            </button>
                        </div>
                    ) : null}
                </div>

                <div className="evaluation-card">
                    <p className="evaluation-card__eyebrow">Parent-safe preview</p>
                    <h3>{parentPreview?.title}</h3>
                    <p>{parentPreview?.summary}</p>
                    <p className="evaluation-miniPanel__meta">
                        Preview only: internal notes and evaluator identities never appear in the parent-facing release.
                    </p>
                </div>
            </div>

            <div className="evaluation-card">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <p className="evaluation-card__eyebrow">Session history</p>
                        <h3>Org review detail</h3>
                    </div>
                    <span className="evaluation-meta">{reviewData?.sessionHistory?.length || 0} sessions</span>
                </div>
                <div className="evaluation-tableWrap">
                    <table className="evaluation-table">
                        <thead>
                            <tr>
                                <th>Session</th>
                                <th>Date</th>
                                <th>Observations</th>
                                <th>Evaluators</th>
                                <th>Weighted average</th>
                                <th>Org-only notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(reviewData?.sessionHistory || []).length ? reviewData.sessionHistory.map((session) => (
                                <tr key={session?.sessionId}>
                                    <td>{session?.sessionName}</td>
                                    <td>{formatDateTimeLabel(session?.sessionDate)}</td>
                                    <td>{session?.observationCount || 0}</td>
                                    <td>{session?.evaluatorCount || 0}</td>
                                    <td>{Number(session?.weightedAverage || 0).toFixed(2)}</td>
                                    <td>
                                        {(session?.notes || []).length ? (
                                            <div className="evaluation-noteStack">
                                                {session.notes.map((note, index) => (
                                                    <p key={`${session?.sessionId}-${index}`}>{note}</p>
                                                ))}
                                            </div>
                                        ) : "--"}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6">
                                        <div className="evaluation-emptyState">No submitted session history yet for this player.</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="evaluation-card">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <p className="evaluation-card__eyebrow">Operational handoff</p>
                        <h3>Roster, schedule, and DJ status</h3>
                    </div>
                    <span className="evaluation-meta">
                        {canOperateHandoffs ? "Available after finalization" : "Finalize with an active roster-path outcome first"}
                    </span>
                </div>

                {!canOperateHandoffs ? (
                    <div className="alert alert-warning">
                        Handoff controls only apply after the outcome is finalized and only for active roster-path states.
                    </div>
                ) : null}

                <div className="evaluation-stepGrid">
                    {["roster", "schedule", "dj"].map((handoffType) => (
                        <div className="evaluation-stepCard" key={handoffType}>
                            <h4>{handoffType.toUpperCase()} handoff</h4>
                            <p>Current status: {outcomeDraft?.handoff?.[handoffType] || "pending"}</p>
                            <div className="evaluation-chipRow">
                                {HANDOFF_STATUS_OPTIONS.map((option) => (
                                    <button
                                        type="button"
                                        key={`${handoffType}-${option.value}`}
                                        className={`evaluation-chip ${outcomeDraft?.handoff?.[handoffType] === option.value ? "is-selected" : ""}`}
                                        onClick={() => handleHandoffUpdate(handoffType, option.value)}
                                        disabled={!canOperateHandoffs || controlsBlocked}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </EvaluationShell>
    );
};

export default PlayerReviewPage;
