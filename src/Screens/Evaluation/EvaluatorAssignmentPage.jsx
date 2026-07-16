import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { listSubAdmin } from "../../api/adminApi";
import {
    createEvaluationAssignment,
    fetchEvaluationAssignmentsBySession,
    fetchEvaluationCycles,
    fetchEvaluationSessions
} from "../../api/evaluationApi";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import { EvaluationShell } from "./EvaluationShell";
import { formatDateTimeLabel } from "./evaluationHelpers";
import { useEvaluationWorkspace } from "./useEvaluationWorkspace";

const ROLE_OPTIONS = [
    { value: "lead", label: "Lead evaluator" },
    { value: "evaluator", label: "Evaluator" },
    { value: "observer", label: "Observer" }
];

export const EvaluatorAssignmentPage = () => {
    const workspace = useEvaluationWorkspace();
    const authData = useSelector((state) => state.isRun);
    const [cycles, setCycles] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState("");
    const [assignments, setAssignments] = useState([]);
    const [evaluators, setEvaluators] = useState([]);
    const [formValue, setFormValue] = useState({
        evaluatorUserId: "",
        role: "evaluator"
    });

    useEffect(() => {
        if (!workspace?.selectedTeamId) {
            return;
        }

        const loadBaseData = async () => {
            const [cyclesResponse, subadminsResponse] = await Promise.all([
                fetchEvaluationCycles(workspace.selectedTeamId),
                listSubAdmin()
            ]);

            if (cyclesResponse?.status) {
                const nextCycles = cyclesResponse?.cycles || [];
                setCycles(nextCycles);
                if (!workspace?.selectedCycleId && nextCycles?.[0]?._id) {
                    workspace.setSelectedCycle(nextCycles[0]._id);
                }
            }

            const currentUser = authData?.userId ? [{
                _id: authData.userId,
                name: authData.name || "Current admin",
                email: authData.email || "",
                source: "current"
            }] : [];

            const subadminUsers = (subadminsResponse?.result || []).map((user) => ({
                _id: user?._id,
                name: user?.name || "Admin user",
                email: user?.email || "",
                accessLevel: user?.accessLevel || "",
                source: "subadmin"
            }));

            const mergedUsers = [...currentUser, ...subadminUsers].filter(
                (candidate, index, array) => candidate?._id && array.findIndex((item) => item?._id === candidate?._id) === index
            );

            setEvaluators(mergedUsers);
        };

        loadBaseData();
    }, [authData?.email, authData?.name, authData?.userId, workspace?.selectedTeamId]);

    useEffect(() => {
        if (!workspace?.selectedCycleId) {
            setSessions([]);
            return;
        }

        const loadSessions = async () => {
            const response = await fetchEvaluationSessions(workspace.selectedCycleId);
            if (response?.status) {
                const nextSessions = response?.sessions || [];
                setSessions(nextSessions);
                if (!selectedSessionId && nextSessions?.[0]?._id) {
                    setSelectedSessionId(nextSessions[0]._id);
                }
            }
        };

        loadSessions();
    }, [selectedSessionId, workspace?.selectedCycleId]);

    useEffect(() => {
        if (!selectedSessionId) {
            setAssignments([]);
            return;
        }

        const loadAssignments = async () => {
            const response = await fetchEvaluationAssignmentsBySession(selectedSessionId);
            if (response?.status) {
                setAssignments(response?.assignments || []);
            }
        };

        loadAssignments();
    }, [selectedSessionId]);

    const authorityUserId = useMemo(() => {
        return workspace?.selectedTeam?.creatorId?._id
            || workspace?.selectedTeam?.creatorId
            || workspace?.selectedTeam?.coachId?._id
            || workspace?.selectedTeam?.coachId
            || authData?.userId
            || "";
    }, [authData?.userId, workspace?.selectedTeam]);

    const selectedSession = useMemo(() => {
        return sessions.find((session) => session?._id === selectedSessionId) || null;
    }, [selectedSessionId, sessions]);

    const handleSaveAssignment = async () => {
        if (!workspace?.selectedCycleId || !selectedSessionId || !formValue.evaluatorUserId) {
            CustomToastHandler({
                msg: "Select a cycle, session, and evaluator before saving.",
                type: "error"
            });
            return;
        }

        if (formValue.evaluatorUserId === authorityUserId && formValue.role !== "observer") {
            CustomToastHandler({
                msg: "The org authority should not be assigned as a scoring evaluator in the same cycle.",
                type: "error"
            });
            return;
        }

        const response = await createEvaluationAssignment({
            teamId: workspace.selectedTeamId,
            cycleId: workspace.selectedCycleId,
            sessionId: selectedSessionId,
            evaluatorUserId: formValue.evaluatorUserId,
            evaluatorMemberId: null,
            role: formValue.role
        });

        if (response?.status) {
            CustomToastHandler({ msg: response?.message || "Assignment saved." });
            setFormValue({
                evaluatorUserId: "",
                role: "evaluator"
            });
            const refresh = await fetchEvaluationAssignmentsBySession(selectedSessionId);
            if (refresh?.status) {
                setAssignments(refresh?.assignments || []);
            }
            return;
        }

        CustomToastHandler({
            msg: response?.message || "Unable to save the evaluator assignment.",
            type: "error"
        });
    };

    return (
        <EvaluationShell
            workspace={workspace}
            title="Evaluator Assignment"
            description="Assign staff to sessions, keep the org authority out of score-bearing roles, and fail safely if the backend rejects a conflict."
        >
            <div className="evaluation-cardRow">
                <div className="evaluation-card evaluation-card--wide">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                        <div>
                            <p className="evaluation-card__eyebrow">Cycle and session selection</p>
                            <h3>Pick where the evaluator will work</h3>
                        </div>
                    </div>

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
                            <label>Session</label>
                            <select value={selectedSessionId} onChange={(event) => setSelectedSessionId(event.target.value)}>
                                <option value="">Select session</option>
                                {sessions.map((session) => (
                                    <option key={session?._id} value={session?._id}>
                                        {session?.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {selectedSession ? (
                        <div className="evaluation-banner mt-3">
                            <div>
                                <p className="evaluation-banner__title">{selectedSession?.name}</p>
                                <p className="evaluation-banner__copy">
                                    {formatDateTimeLabel(selectedSession?.sessionDate)} • {selectedSession?.venue || "Venue TBD"} •{" "}
                                    {selectedSession?.rosterSnapshot?.length || 0} player snapshot
                                </p>
                            </div>
                            <span className="evaluation-pill is-enabled">{selectedSession?.status || "draft"}</span>
                        </div>
                    ) : null}
                </div>

                <div className="evaluation-card">
                    <p className="evaluation-card__eyebrow">Assignment rule</p>
                    <h3>Conflict guard</h3>
                    <p>
                        An evaluator assigned in this cycle cannot act as the org authority when final outcomes are saved,
                        finalized, released, or handed off.
                    </p>
                    <p className="evaluation-miniPanel__meta">
                        Current authority ID: {authorityUserId || "Unavailable"}
                    </p>
                </div>
            </div>

            <div className="evaluation-card">
                <div className="evaluation-formGrid">
                    <div className="evaluation-field">
                        <label>Evaluator</label>
                        <select
                            value={formValue.evaluatorUserId}
                            onChange={(event) => setFormValue((current) => ({ ...current, evaluatorUserId: event.target.value }))}
                        >
                            <option value="">Select evaluator</option>
                            {evaluators.map((candidate) => {
                                const isAuthorityConflict = candidate?._id === authorityUserId;
                                return (
                                    <option key={candidate?._id} value={candidate?._id}>
                                        {candidate?.name} {candidate?.email ? `(${candidate.email})` : ""}{isAuthorityConflict ? " - org authority" : ""}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                    <div className="evaluation-field">
                        <label>Role</label>
                        <select
                            value={formValue.role}
                            onChange={(event) => setFormValue((current) => ({ ...current, role: event.target.value }))}
                        >
                            {ROLE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {formValue.evaluatorUserId === authorityUserId && formValue.role !== "observer" ? (
                    <div className="alert alert-warning mt-3">
                        This selection would create an authority conflict. Keep the org authority out of lead/evaluator roles for this cycle.
                    </div>
                ) : null}

                <div className="evaluation-actionRow">
                    <button type="button" className="orange_small_primary" onClick={handleSaveAssignment}>
                        Save assignment
                    </button>
                </div>
            </div>

            <div className="evaluation-card">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <p className="evaluation-card__eyebrow">Current assignments</p>
                        <h3>Session coverage</h3>
                    </div>
                    <span className="evaluation-meta">{assignments.length} assigned</span>
                </div>
                <div className="evaluation-list">
                    {assignments.length ? assignments.map((assignment) => (
                        <div key={assignment?._id} className="evaluation-listItem">
                            <div>
                                <strong>
                                    {assignment?.evaluatorUserId?.firstname
                                        ? `${assignment?.evaluatorUserId?.firstname} ${assignment?.evaluatorUserId?.lastname || ""}`.trim()
                                        : assignment?.evaluatorUserId?.email || "Assigned evaluator"}
                                </strong>
                                <p>
                                    {assignment?.role || "evaluator"} • {assignment?.evaluatorUserId?.email || "No email"} •{" "}
                                    assigned {formatDateTimeLabel(assignment?.assignedAt)}
                                </p>
                            </div>
                            <span className={`evaluation-pill ${assignment?.role === "observer" ? "is-warning" : "is-enabled"}`}>
                                {assignment?.role || "evaluator"}
                            </span>
                        </div>
                    )) : (
                        <div className="evaluation-emptyState">No assignments yet for the selected session.</div>
                    )}
                </div>
            </div>
        </EvaluationShell>
    );
};

export default EvaluatorAssignmentPage;
