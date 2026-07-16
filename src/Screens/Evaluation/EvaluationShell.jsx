import React from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "../../Layouts/dashboardLayout";

const NAV_ITEMS = [
    { label: "Entry", path: "/sports-evaluation" },
    { label: "Scheme Builder", path: "/sports-evaluation/schemes" },
    { label: "Template Editor", path: "/sports-evaluation/templates" },
    { label: "Cycle Setup", path: "/sports-evaluation/cycles" },
    { label: "Evaluator Assignment", path: "/sports-evaluation/assignments" },
    { label: "Org Dashboard", path: "/sports-evaluation/dashboard" }
];

export const EvaluationShell = ({
    workspace,
    title,
    description,
    actions,
    requireEnabled = true,
    children
}) => {
    const isBlocked = requireEnabled && workspace?.selectedTeam && !workspace?.canAccessModule;

    return (
        <DashboardLayout>
            <div className="common_page_scroller pb-5 mt-3 mt-sm-5 pe-2">
                <div className="evaluation-shell dashboard_box rounded-3">
                    <div className="evaluation-shell__header">
                        <div>
                            <p className="evaluation-shell__eyebrow">Sports Evaluation</p>
                            <h1 className="evaluation-shell__title">{title}</h1>
                            <p className="evaluation-shell__description">{description}</p>
                        </div>
                        <div className="evaluation-shell__controls">
                            <div className="evaluation-shell__select">
                                <label className="evaluation-shell__label" htmlFor="evaluation-team-select">
                                    Team / Org context
                                </label>
                                <select
                                    id="evaluation-team-select"
                                    className="evaluation-select"
                                    value={workspace?.selectedTeamId}
                                    onChange={(event) => workspace?.setSelectedTeam(event.target.value)}
                                >
                                    {(workspace?.teams || []).map((team) => (
                                        <option value={team?._id} key={team?._id}>
                                            {team?.teamName || "Untitled team"}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="evaluation-shell__statusHolder">
                                <span className={`evaluation-pill ${workspace?.canAccessModule ? "is-enabled" : "is-disabled"}`}>
                                    {workspace?.canAccessModule ? "Module enabled" : "Module disabled"}
                                </span>
                                {workspace?.featureSource?.source === "local" ? (
                                    <span className="evaluation-meta">Web toggle</span>
                                ) : null}
                                {workspace?.featureSource?.source === "backend" ? (
                                    <span className="evaluation-meta">Server-managed</span>
                                ) : null}
                            </div>
                            {actions}
                        </div>
                    </div>

                    <div className="evaluation-shell__nav">
                        {NAV_ITEMS.map((item) => {
                            const isActive = workspace?.location?.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={workspace?.buildRoute(item.path)}
                                    className={`evaluation-navLink ${isActive ? "is-active" : ""}`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    {workspace?.teamError ? (
                        <div className="alert alert-danger mb-4">{workspace.teamError}</div>
                    ) : null}

                    {workspace?.isLoadingTeams ? (
                        <div className="evaluation-emptyState">Loading team access…</div>
                    ) : null}

                    {!workspace?.isLoadingTeams && !workspace?.selectedTeam ? (
                        <div className="evaluation-emptyState">Select a team to continue.</div>
                    ) : null}

                    {isBlocked ? (
                        <div className="evaluation-guard">
                            <h3>This module is not enabled for the selected team.</h3>
                            <p>
                                Turn Sports Evaluation on from the module entry page before accessing setup, review,
                                release, or handoff routes.
                            </p>
                            <Link className="orange_small_primary" to={workspace?.buildRoute("/sports-evaluation", { cycleId: "" })}>
                                Return to entry page
                            </Link>
                        </div>
                    ) : null}

                    {!workspace?.isLoadingTeams && workspace?.selectedTeam && !isBlocked ? children : null}
                </div>
            </div>
        </DashboardLayout>
    );
};
