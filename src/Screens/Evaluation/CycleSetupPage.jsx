import React, { useEffect, useMemo, useState } from "react";
import {
    createEvaluationCycle,
    createEvaluationSession,
    fetchEvaluationCycles,
    fetchEvaluationSessions,
    fetchEvaluationSchemes,
    fetchEvaluationTemplates
} from "../../api/evaluationApi";
import { listAllMember } from "../../api/memberApi";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import { EvaluationShell } from "./EvaluationShell";
import { SESSION_TYPE_OPTIONS, SPORT_OPTIONS, formatDateTimeLabel } from "./evaluationHelpers";
import { useEvaluationWorkspace } from "./useEvaluationWorkspace";

const createInitialCycleForm = () => ({
    sport: "",
    schemeId: "",
    defaultTemplateId: "",
    name: "",
    description: "",
    seasonLabel: "",
    status: "draft",
    startsAt: "",
    endsAt: ""
});

const createInitialSessionForm = () => ({
    templateId: "",
    name: "",
    eventType: "evaluation",
    sessionDate: "",
    venue: "",
    status: "draft",
    rosterMemberIds: []
});

export const CycleSetupPage = () => {
    const workspace = useEvaluationWorkspace();
    const [cycleForm, setCycleForm] = useState(createInitialCycleForm());
    const [sessionForm, setSessionForm] = useState(createInitialSessionForm());
    const [cycles, setCycles] = useState([]);
    const [schemes, setSchemes] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [members, setMembers] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [cycleErrors, setCycleErrors] = useState({});
    const [sessionErrors, setSessionErrors] = useState({});

    useEffect(() => {
        if (!workspace?.selectedTeamId) {
            return;
        }

        const loadSetupData = async () => {
            const [cyclesResponse, schemesResponse, templatesResponse, membersResponse] = await Promise.all([
                fetchEvaluationCycles(workspace.selectedTeamId),
                fetchEvaluationSchemes(workspace.selectedTeamId),
                fetchEvaluationTemplates(workspace.selectedTeamId),
                listAllMember({ teamId: workspace.selectedTeamId })
            ]);

            if (cyclesResponse?.status) {
                const nextCycles = cyclesResponse?.cycles || [];
                setCycles(nextCycles);
                if (!workspace?.selectedCycleId && nextCycles?.[0]?._id) {
                    workspace.setSelectedCycle(nextCycles[0]._id);
                }
            }

            if (schemesResponse?.status) {
                setSchemes(schemesResponse?.schemes || []);
            }

            if (templatesResponse?.status) {
                setTemplates(templatesResponse?.templates || []);
            }

            if (membersResponse?.status) {
                setMembers(membersResponse?.result || []);
            }
        };

        loadSetupData();
    }, [workspace?.selectedTeamId]);

    useEffect(() => {
        if (!workspace?.selectedCycleId) {
            setSessions([]);
            return;
        }

        const loadSessions = async () => {
            const response = await fetchEvaluationSessions(workspace.selectedCycleId);
            if (response?.status) {
                setSessions(response?.sessions || []);
            }
        };

        loadSessions();
    }, [workspace?.selectedCycleId]);

    const filteredSchemes = useMemo(() => {
        if (!cycleForm.sport) {
            return schemes;
        }
        return schemes.filter((scheme) => scheme?.sport === cycleForm.sport);
    }, [cycleForm.sport, schemes]);

    const filteredTemplates = useMemo(() => {
        return templates.filter((template) => {
            if (cycleForm.sport && template?.sport !== cycleForm.sport) {
                return false;
            }
            if (cycleForm.schemeId && template?.schemeId !== cycleForm.schemeId) {
                return false;
            }
            return true;
        });
    }, [cycleForm.schemeId, cycleForm.sport, templates]);

    const validateCycle = () => {
        const nextErrors = {};

        if (!cycleForm.name.trim()) {
            nextErrors.name = "Cycle name is required.";
        }
        if (!cycleForm.sport) {
            nextErrors.sport = "Sport is required.";
        }
        if (!cycleForm.schemeId) {
            nextErrors.schemeId = "Choose a linked scheme.";
        }

        setCycleErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const validateSession = () => {
        const nextErrors = {};

        if (!workspace?.selectedCycleId) {
            nextErrors.cycle = "Create or select a cycle before adding sessions.";
        }
        if (!sessionForm.templateId) {
            nextErrors.templateId = "Choose a template.";
        }
        if (!sessionForm.name.trim()) {
            nextErrors.name = "Session name is required.";
        }
        if (!sessionForm.rosterMemberIds.length) {
            nextErrors.roster = "Select at least one roster member for the session snapshot.";
        }

        setSessionErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const refreshCycles = async (nextCycleId) => {
        const response = await fetchEvaluationCycles(workspace.selectedTeamId);
        if (response?.status) {
            const nextCycles = response?.cycles || [];
            setCycles(nextCycles);
            if (nextCycleId) {
                workspace.setSelectedCycle(nextCycleId);
            }
        }
    };

    const refreshSessions = async (cycleId = workspace?.selectedCycleId) => {
        if (!cycleId) {
            return;
        }

        const response = await fetchEvaluationSessions(cycleId);
        if (response?.status) {
            setSessions(response?.sessions || []);
        }
    };

    const handleCreateCycle = async () => {
        if (!workspace?.selectedTeamId || !validateCycle()) {
            return;
        }

        const payload = {
            orgId: workspace?.selectedTeam?.orgId?._id || workspace?.selectedTeam?.orgId || null,
            teamId: workspace.selectedTeamId,
            sport: cycleForm.sport,
            schemeId: cycleForm.schemeId,
            defaultTemplateId: cycleForm.defaultTemplateId || null,
            name: cycleForm.name.trim(),
            description: cycleForm.description.trim(),
            seasonLabel: cycleForm.seasonLabel.trim(),
            status: cycleForm.status,
            startsAt: cycleForm.startsAt || null,
            endsAt: cycleForm.endsAt || null
        };

        const response = await createEvaluationCycle(payload);
        if (response?.status) {
            CustomToastHandler({ msg: response?.message || "Cycle created." });
            setCycleForm(createInitialCycleForm());
            setCycleErrors({});
            await refreshCycles(response?.cycle?._id);
            return;
        }

        CustomToastHandler({
            msg: response?.message || "Unable to create the cycle.",
            type: "error"
        });
    };

    const handleCreateSession = async () => {
        if (!validateSession()) {
            return;
        }

        const rosterSnapshot = members
            .filter((member) => sessionForm.rosterMemberIds.includes(member?._id))
            .map((member) => ({
                memberId: member?._id,
                jerseyNumber: member?.number || member?.jerseyNumber || "",
                position: member?.position || "",
                status: member?.status || "registered"
            }));

        const payload = {
            teamId: workspace.selectedTeamId,
            cycleId: workspace.selectedCycleId,
            templateId: sessionForm.templateId,
            linkedEventId: null,
            name: sessionForm.name.trim(),
            eventType: sessionForm.eventType,
            sessionDate: sessionForm.sessionDate || null,
            venue: sessionForm.venue.trim(),
            status: sessionForm.status,
            rosterSnapshot,
            metadata: {
                createdFromWeb: true
            }
        };

        const response = await createEvaluationSession(payload);
        if (response?.status) {
            CustomToastHandler({ msg: response?.message || "Session created." });
            setSessionForm(createInitialSessionForm());
            setSessionErrors({});
            await refreshSessions();
            return;
        }

        CustomToastHandler({
            msg: response?.message || "Unable to create the session.",
            type: "error"
        });
    };

    const toggleRosterMember = (memberId) => {
        setSessionForm((current) => {
            const isSelected = current.rosterMemberIds.includes(memberId);
            return {
                ...current,
                rosterMemberIds: isSelected
                    ? current.rosterMemberIds.filter((id) => id !== memberId)
                    : [...current.rosterMemberIds, memberId]
            };
        });
    };

    return (
        <EvaluationShell
            workspace={workspace}
            title="Cycle Setup"
            description="Create evaluation cycles in draft mode, connect a scheme and default template, and then create team roster session snapshots."
        >
            <div className="evaluation-card">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                    <div>
                        <p className="evaluation-card__eyebrow">Cycle builder</p>
                        <h3>Create the evaluation cycle</h3>
                    </div>
                    <div className="evaluation-field evaluation-field--compact">
                        <label>Current cycle</label>
                        <select value={workspace?.selectedCycleId} onChange={(event) => workspace.setSelectedCycle(event.target.value)}>
                            <option value="">Select cycle</option>
                            {cycles.map((cycle) => (
                                <option key={cycle?._id} value={cycle?._id}>
                                    {cycle?.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="evaluation-formGrid">
                    <div className="evaluation-field">
                        <label>Cycle name</label>
                        <input
                            type="text"
                            value={cycleForm.name}
                            onChange={(event) => setCycleForm((current) => ({ ...current, name: event.target.value }))}
                            placeholder="Example: 2026 Spring Evaluations"
                        />
                        {cycleErrors.name ? <span className="text-danger">{cycleErrors.name}</span> : null}
                    </div>
                    <div className="evaluation-field">
                        <label>Sport</label>
                        <select
                            value={cycleForm.sport}
                            onChange={(event) => setCycleForm((current) => ({
                                ...current,
                                sport: event.target.value,
                                schemeId: "",
                                defaultTemplateId: ""
                            }))}
                        >
                            <option value="">Select sport</option>
                            {SPORT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {cycleErrors.sport ? <span className="text-danger">{cycleErrors.sport}</span> : null}
                    </div>
                    <div className="evaluation-field">
                        <label>Linked scheme</label>
                        <select
                            value={cycleForm.schemeId}
                            onChange={(event) => setCycleForm((current) => ({ ...current, schemeId: event.target.value, defaultTemplateId: "" }))}
                        >
                            <option value="">Select scheme</option>
                            {filteredSchemes.map((scheme) => (
                                <option key={scheme?._id} value={scheme?._id}>
                                    {scheme?.name}
                                </option>
                            ))}
                        </select>
                        {cycleErrors.schemeId ? <span className="text-danger">{cycleErrors.schemeId}</span> : null}
                    </div>
                    <div className="evaluation-field">
                        <label>Default template</label>
                        <select
                            value={cycleForm.defaultTemplateId}
                            onChange={(event) => setCycleForm((current) => ({ ...current, defaultTemplateId: event.target.value }))}
                        >
                            <option value="">Optional template</option>
                            {filteredTemplates.map((template) => (
                                <option key={template?._id} value={template?._id}>
                                    {template?.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="evaluation-field">
                        <label>Season label</label>
                        <input
                            type="text"
                            value={cycleForm.seasonLabel}
                            onChange={(event) => setCycleForm((current) => ({ ...current, seasonLabel: event.target.value }))}
                            placeholder="2026 Spring"
                        />
                    </div>
                    <div className="evaluation-field">
                        <label>Status</label>
                        <select value={cycleForm.status} onChange={(event) => setCycleForm((current) => ({ ...current, status: event.target.value }))}>
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                            <option value="review">Review</option>
                            <option value="finalized">Finalized</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                    <div className="evaluation-field">
                        <label>Starts at</label>
                        <input
                            type="datetime-local"
                            value={cycleForm.startsAt}
                            onChange={(event) => setCycleForm((current) => ({ ...current, startsAt: event.target.value }))}
                        />
                    </div>
                    <div className="evaluation-field">
                        <label>Ends at</label>
                        <input
                            type="datetime-local"
                            value={cycleForm.endsAt}
                            onChange={(event) => setCycleForm((current) => ({ ...current, endsAt: event.target.value }))}
                        />
                    </div>
                </div>

                <div className="evaluation-field mt-3">
                    <label>Description</label>
                    <textarea
                        rows="3"
                        value={cycleForm.description}
                        onChange={(event) => setCycleForm((current) => ({ ...current, description: event.target.value }))}
                        placeholder="Add notes about the purpose of this cycle."
                    />
                </div>

                <div className="evaluation-actionRow">
                    <button type="button" className="orange_small_primary" onClick={handleCreateCycle}>
                        Save cycle
                    </button>
                </div>
            </div>

            <div className="evaluation-card">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                    <div>
                        <p className="evaluation-card__eyebrow">Session creation</p>
                        <h3>Create sessions inside the selected cycle</h3>
                    </div>
                    {sessionErrors.cycle ? <span className="text-danger">{sessionErrors.cycle}</span> : null}
                </div>

                <div className="evaluation-formGrid">
                    <div className="evaluation-field">
                        <label>Template</label>
                        <select
                            value={sessionForm.templateId}
                            onChange={(event) => setSessionForm((current) => ({ ...current, templateId: event.target.value }))}
                        >
                            <option value="">Select template</option>
                            {filteredTemplates.map((template) => (
                                <option key={template?._id} value={template?._id}>
                                    {template?.name}
                                </option>
                            ))}
                        </select>
                        {sessionErrors.templateId ? <span className="text-danger">{sessionErrors.templateId}</span> : null}
                    </div>
                    <div className="evaluation-field">
                        <label>Session name</label>
                        <input
                            type="text"
                            value={sessionForm.name}
                            onChange={(event) => setSessionForm((current) => ({ ...current, name: event.target.value }))}
                            placeholder="Example: Small Area Game 1"
                        />
                        {sessionErrors.name ? <span className="text-danger">{sessionErrors.name}</span> : null}
                    </div>
                    <div className="evaluation-field">
                        <label>Session type</label>
                        <select
                            value={sessionForm.eventType}
                            onChange={(event) => setSessionForm((current) => ({ ...current, eventType: event.target.value }))}
                        >
                            {SESSION_TYPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.value}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="evaluation-field">
                        <label>Session date</label>
                        <input
                            type="datetime-local"
                            value={sessionForm.sessionDate}
                            onChange={(event) => setSessionForm((current) => ({ ...current, sessionDate: event.target.value }))}
                        />
                    </div>
                    <div className="evaluation-field">
                        <label>Venue</label>
                        <input
                            type="text"
                            value={sessionForm.venue}
                            onChange={(event) => setSessionForm((current) => ({ ...current, venue: event.target.value }))}
                            placeholder="Arena / field / gym"
                        />
                    </div>
                </div>

                <div className="evaluation-card mt-4">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                            <p className="evaluation-card__eyebrow">Roster snapshot</p>
                            <h3>Select players for this session</h3>
                        </div>
                        <span className="evaluation-meta">{sessionForm.rosterMemberIds.length} selected</span>
                    </div>
                    <div className="evaluation-checkboxGrid">
                        {members.map((member) => (
                            <label key={member?._id} className="evaluation-checkbox">
                                <input
                                    type="checkbox"
                                    checked={sessionForm.rosterMemberIds.includes(member?._id)}
                                    onChange={() => toggleRosterMember(member?._id)}
                                />
                                <span>
                                    <strong>{`${member?.firstname || ""} ${member?.lastname || ""}`.trim() || "Player"}</strong>
                                    <small>{member?.position || "Position not set"} • #{member?.number || "--"}</small>
                                </span>
                            </label>
                        ))}
                    </div>
                    {sessionErrors.roster ? <span className="text-danger">{sessionErrors.roster}</span> : null}
                </div>

                <div className="evaluation-actionRow">
                    <button type="button" className="orange_small_primary" onClick={handleCreateSession}>
                        Save session
                    </button>
                </div>
            </div>

            <div className="evaluation-cardRow">
                <div className="evaluation-card evaluation-card--wide">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                            <p className="evaluation-card__eyebrow">Saved cycles</p>
                            <h3>Cycle history</h3>
                        </div>
                        <span className="evaluation-meta">{cycles.length} total</span>
                    </div>
                    <div className="evaluation-list">
                        {cycles.length ? cycles.map((cycle) => (
                            <button
                                key={cycle?._id}
                                type="button"
                                className={`evaluation-listItem evaluation-listItem--button ${workspace?.selectedCycleId === cycle?._id ? "is-active" : ""}`}
                                onClick={() => workspace.setSelectedCycle(cycle?._id)}
                            >
                                <div>
                                    <strong>{cycle?.name}</strong>
                                    <p>{cycle?.seasonLabel || "--"} • {cycle?.status || "draft"}</p>
                                </div>
                                <span className="evaluation-meta">{formatDateTimeLabel(cycle?.createdAt)}</span>
                            </button>
                        )) : (
                            <div className="evaluation-emptyState">No cycles created for this team yet.</div>
                        )}
                    </div>
                </div>

                <div className="evaluation-card">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                            <p className="evaluation-card__eyebrow">Cycle sessions</p>
                            <h3>Selected cycle detail</h3>
                        </div>
                        <span className="evaluation-meta">{sessions.length} sessions</span>
                    </div>
                    <div className="evaluation-list">
                        {sessions.length ? sessions.map((session) => (
                            <div key={session?._id} className="evaluation-listItem">
                                <div>
                                    <strong>{session?.name}</strong>
                                    <p>{formatDateTimeLabel(session?.sessionDate)} • {session?.venue || "Venue TBD"}</p>
                                </div>
                                <span className="evaluation-pill is-enabled">{session?.rosterSnapshot?.length || 0} players</span>
                            </div>
                        )) : (
                            <div className="evaluation-emptyState">No sessions created for the selected cycle yet.</div>
                        )}
                    </div>
                </div>
            </div>
        </EvaluationShell>
    );
};

export default CycleSetupPage;
