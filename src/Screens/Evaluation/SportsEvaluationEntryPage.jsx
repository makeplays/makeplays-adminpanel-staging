import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    fetchEvaluationCycles,
    fetchEvaluationSchemes,
    fetchEvaluationTemplates,
    listRegistrationFormsByTeam
} from "../../api/evaluationApi";
import {
    getEvaluationFeatureSource,
    setEvaluationModuleEnabled
} from "../../lib/evaluationModule";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import { EvaluationShell } from "./EvaluationShell";
import { formatDateLabel } from "./evaluationHelpers";
import { useEvaluationWorkspace } from "./useEvaluationWorkspace";

const WORKFLOW_STEPS = [
    {
        title: "1. Scheme Builder",
        body: "Define sport-specific pillars and exact 100-point weighting before any scoring starts.",
        path: "/sports-evaluation/schemes"
    },
    {
        title: "2. Template Editor",
        body: "Lock session defaults, scoring scale, comments policy, and leadership-tag visibility.",
        path: "/sports-evaluation/templates"
    },
    {
        title: "3. Cycle Setup",
        body: "Create the evaluation cycle, attach the season context, and create sessions after registration.",
        path: "/sports-evaluation/cycles"
    },
    {
        title: "4. Org Review",
        body: "Manage assignments, review player rollups, finalize outcomes, and control parent release.",
        path: "/sports-evaluation/dashboard"
    }
];

const SummaryCard = ({ label, value, hint }) => (
    <div className="evaluation-summaryCard">
        <p className="evaluation-summaryCard__label">{label}</p>
        <p className="evaluation-summaryCard__value">{value}</p>
        <p className="evaluation-summaryCard__hint">{hint}</p>
    </div>
);

export const SportsEvaluationEntryPage = () => {
    const workspace = useEvaluationWorkspace();
    const [isLoading, setIsLoading] = useState(false);
    const [entryData, setEntryData] = useState({
        forms: [],
        schemes: [],
        templates: [],
        cycles: []
    });

    useEffect(() => {
        if (!workspace?.selectedTeamId) {
            return;
        }

        let isMounted = true;

        const loadEntryData = async () => {
            setIsLoading(true);

            const [formsResponse, schemesResponse, templatesResponse, cyclesResponse] = await Promise.all([
                listRegistrationFormsByTeam(workspace.selectedTeamId),
                fetchEvaluationSchemes(workspace.selectedTeamId),
                fetchEvaluationTemplates(workspace.selectedTeamId),
                fetchEvaluationCycles(workspace.selectedTeamId)
            ]);

            if (!isMounted) {
                return;
            }

            setEntryData({
                forms: formsResponse?.data || [],
                schemes: schemesResponse?.schemes || [],
                templates: templatesResponse?.templates || [],
                cycles: cyclesResponse?.cycles || []
            });
            setIsLoading(false);
        };

        loadEntryData();

        return () => {
            isMounted = false;
        };
    }, [workspace?.selectedTeamId]);

    const featureSource = useMemo(() => {
        return getEvaluationFeatureSource(workspace?.selectedTeam);
    }, [workspace?.selectedTeam, workspace?.canAccessModule]);

    const handleModuleToggle = () => {
        if (!workspace?.selectedTeamId) {
            return;
        }

        if (featureSource?.source === "backend") {
            CustomToastHandler({
                msg: "This team is using a server-managed Sports Evaluation flag.",
                type: "error"
            });
            return;
        }

        const nextValue = !workspace?.canAccessModule;
        setEvaluationModuleEnabled(workspace.selectedTeamId, nextValue);
        workspace.refreshModuleAccess();
        CustomToastHandler({
            msg: nextValue ? "Sports Evaluation enabled for this team." : "Sports Evaluation disabled for this team."
        });
    };

    const latestCycle = entryData?.cycles?.[0];
    const hasRegistration = entryData.forms.length > 0;

    return (
        <EvaluationShell
            workspace={workspace}
            title="Module Entry"
            description="This web-only control surface sits after registration and gives org/admin staff a single place to enable, configure, review, finalize, release, and hand off evaluation decisions."
            requireEnabled={false}
            actions={(
                <button
                    className={`evaluation-toggle ${workspace?.canAccessModule ? "is-on" : "is-off"}`}
                    onClick={handleModuleToggle}
                    type="button"
                >
                    {workspace?.canAccessModule ? "Disable module" : "Enable module"}
                </button>
            )}
        >
            <div className="evaluation-banner">
                <div>
                    <p className="evaluation-banner__title">Workflow placement</p>
                    <p className="evaluation-banner__copy">
                        Registration complete {"->"} Sports Evaluation setup {"->"} Evaluation cycle management {"->"} Org review {"->"} Parent release {"->"} Handoff actions
                    </p>
                </div>
                <span className={`evaluation-pill ${hasRegistration ? "is-enabled" : "is-warning"}`}>
                    {hasRegistration ? "Registration flow found" : "Registration flow missing"}
                </span>
            </div>

            {!hasRegistration ? (
                <div className="alert alert-warning">
                    No registration forms were found for this team yet. The evaluation workflow still renders, but the intended placement is after registration has been configured.
                </div>
            ) : null}

            <div className="evaluation-summaryGrid">
                <SummaryCard
                    label="Registration Forms"
                    value={entryData.forms.length}
                    hint={hasRegistration ? "This module should follow these forms in the workflow." : "Create or link forms first."}
                />
                <SummaryCard
                    label="Schemes"
                    value={entryData.schemes.length}
                    hint="Weighted evaluation frameworks saved for this team."
                />
                <SummaryCard
                    label="Templates"
                    value={entryData.templates.length}
                    hint="Reusable session templates with evaluator defaults."
                />
                <SummaryCard
                    label="Cycles"
                    value={entryData.cycles.length}
                    hint="Active, draft, and archived evaluation cycles."
                />
            </div>

            <div className="evaluation-cardRow">
                <div className="evaluation-card evaluation-card--wide">
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                        <div>
                            <p className="evaluation-card__eyebrow">Module gating</p>
                            <h3>Team-level access is enforced before setup and review routes open.</h3>
                            <p>
                                When disabled, the downstream pages fail safely and redirect staff back here instead of
                                showing protected evaluation controls.
                            </p>
                        </div>
                        <span className={`evaluation-pill ${workspace?.canAccessModule ? "is-enabled" : "is-disabled"}`}>
                            {workspace?.canAccessModule ? "Enabled" : "Disabled"}
                        </span>
                    </div>

                    <div className="evaluation-checklist">
                        <p>Final authority stays with org/admin staff.</p>
                        <p>Parent-facing releases stay neutral and do not explain non-selection.</p>
                        <p>Leadership tags default off and are not evaluator-facing by default.</p>
                        <p>Evaluators in a cycle are blocked from acting as final authority in that same cycle.</p>
                    </div>
                </div>

                <div className="evaluation-card">
                    <p className="evaluation-card__eyebrow">Latest cycle</p>
                    {latestCycle ? (
                        <>
                            <h3>{latestCycle?.name}</h3>
                            <p>Status: {latestCycle?.status || "draft"}</p>
                            <p>Season: {latestCycle?.seasonLabel || "--"}</p>
                            <Link
                                className="orange_small_primary"
                                to={workspace.buildRoute("/sports-evaluation/dashboard", { cycleId: latestCycle?._id })}
                            >
                                Open org dashboard
                            </Link>
                        </>
                    ) : (
                        <>
                            <h3>No evaluation cycle yet</h3>
                            <p>Create the first cycle after your scheme and template are ready.</p>
                            <Link className="orange_small_primary" to={workspace.buildRoute("/sports-evaluation/cycles")}>
                                Start cycle setup
                            </Link>
                        </>
                    )}
                </div>
            </div>

            <div className="evaluation-card">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <p className="evaluation-card__eyebrow">One coordinated pass</p>
                        <h3>Admin workflow after registration</h3>
                    </div>
                    {isLoading ? <span className="evaluation-meta">Refreshing…</span> : null}
                </div>
                <div className="evaluation-stepGrid">
                    {WORKFLOW_STEPS.map((step) => (
                        <div key={step.title} className={`evaluation-stepCard ${workspace?.canAccessModule ? "" : "is-disabled"}`}>
                            <h4>{step.title}</h4>
                            <p>{step.body}</p>
                            <Link
                                to={workspace.buildRoute(step.path, { cycleId: step.path.includes("dashboard") ? latestCycle?._id || "" : workspace?.selectedCycleId })}
                                className={`evaluation-inlineLink ${workspace?.canAccessModule ? "" : "is-disabled"}`}
                            >
                                Continue
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            <div className="evaluation-card">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <p className="evaluation-card__eyebrow">Recent setup state</p>
                        <h3>Operational snapshot</h3>
                    </div>
                </div>
                <div className="evaluation-miniGrid">
                    <div className="evaluation-miniPanel">
                        <p className="evaluation-miniPanel__label">Most recent registration form</p>
                        <p className="evaluation-miniPanel__value">
                            {entryData.forms?.[0]?.title || "No forms yet"}
                        </p>
                        <p className="evaluation-miniPanel__meta">
                            {entryData.forms?.[0]?.createdAt ? `Created ${formatDateLabel(entryData.forms[0].createdAt)}` : "Registration should be configured first."}
                        </p>
                    </div>
                    <div className="evaluation-miniPanel">
                        <p className="evaluation-miniPanel__label">Most recent scheme</p>
                        <p className="evaluation-miniPanel__value">{entryData.schemes?.[0]?.name || "No scheme saved"}</p>
                        <p className="evaluation-miniPanel__meta">
                            {entryData.schemes?.[0]?.sport ? `Sport: ${entryData.schemes[0].sport}` : "Sport must be selected explicitly."}
                        </p>
                    </div>
                    <div className="evaluation-miniPanel">
                        <p className="evaluation-miniPanel__label">Most recent template</p>
                        <p className="evaluation-miniPanel__value">{entryData.templates?.[0]?.name || "No template saved"}</p>
                        <p className="evaluation-miniPanel__meta">
                            {entryData.templates?.[0]?.sessionType ? `Session type: ${entryData.templates[0].sessionType}` : "Templates hold evaluator defaults."}
                        </p>
                    </div>
                    <div className="evaluation-miniPanel">
                        <p className="evaluation-miniPanel__label">Most recent cycle</p>
                        <p className="evaluation-miniPanel__value">{latestCycle?.name || "No cycle created"}</p>
                        <p className="evaluation-miniPanel__meta">
                            {latestCycle?.createdAt ? `Created ${formatDateLabel(latestCycle.createdAt)}` : "Cycles start as draft by design."}
                        </p>
                    </div>
                </div>
            </div>
        </EvaluationShell>
    );
};

export default SportsEvaluationEntryPage;
