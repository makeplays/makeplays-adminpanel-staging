import React, { useEffect, useMemo, useState } from "react";
import { createEvaluationTemplate, fetchEvaluationSchemes, fetchEvaluationTemplates } from "../../api/evaluationApi";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import { EvaluationShell } from "./EvaluationShell";
import {
    COMMENT_POLICY_OPTIONS,
    SCORING_SCALE_OPTIONS,
    SESSION_TYPE_OPTIONS,
    SPORT_OPTIONS,
    getScoreScaleByValue
} from "./evaluationHelpers";
import { useEvaluationWorkspace } from "./useEvaluationWorkspace";

const createInitialTemplateForm = () => ({
    sport: "",
    schemeId: "",
    name: "",
    description: "",
    sessionType: "evaluation",
    activePillars: [],
    commentPolicy: "optional",
    scoringScaleKey: "standard-5",
    editWindowMinutes: 15,
    showLeadershipTags: false
});

export const TemplateEditorPage = () => {
    const workspace = useEvaluationWorkspace();
    const [formValue, setFormValue] = useState(createInitialTemplateForm());
    const [errors, setErrors] = useState({});
    const [schemes, setSchemes] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!workspace?.selectedTeamId) {
            return;
        }

        const loadData = async () => {
            const [schemesResponse, templatesResponse] = await Promise.all([
                fetchEvaluationSchemes(workspace.selectedTeamId),
                fetchEvaluationTemplates(workspace.selectedTeamId)
            ]);

            if (schemesResponse?.status) {
                setSchemes(schemesResponse?.schemes || []);
            }

            if (templatesResponse?.status) {
                setTemplates(templatesResponse?.templates || []);
            }
        };

        loadData();
    }, [workspace?.selectedTeamId]);

    const selectedScheme = useMemo(() => {
        return schemes.find((scheme) => scheme?._id === formValue.schemeId) || null;
    }, [formValue.schemeId, schemes]);

    const filteredSchemes = useMemo(() => {
        if (!formValue.sport) {
            return schemes;
        }

        return schemes.filter((scheme) => scheme?.sport === formValue.sport);
    }, [formValue.sport, schemes]);

    const handleSchemeChange = (schemeId) => {
        const nextScheme = schemes.find((scheme) => scheme?._id === schemeId);
        setFormValue((current) => ({
            ...current,
            schemeId,
            activePillars: current.activePillars.filter((pillar) => nextScheme?.categories?.some((category) => category.key === pillar))
        }));
    };

    const togglePillar = (pillarKey) => {
        setFormValue((current) => {
            const alreadyActive = current.activePillars.includes(pillarKey);
            return {
                ...current,
                activePillars: alreadyActive
                    ? current.activePillars.filter((pillar) => pillar !== pillarKey)
                    : [...current.activePillars, pillarKey]
            };
        });
    };

    const validateForm = () => {
        const nextErrors = {};

        if (!formValue.sport) {
            nextErrors.sport = "Sport selection is required.";
        }
        if (!formValue.schemeId) {
            nextErrors.schemeId = "Choose a scheme to inherit categories from.";
        }
        if (!formValue.name.trim()) {
            nextErrors.name = "Template name is required.";
        }
        if (!formValue.activePillars.length) {
            nextErrors.activePillars = "Activate at least one pillar.";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSave = async () => {
        if (!workspace?.selectedTeamId || !validateForm()) {
            return;
        }

        setIsSaving(true);
        const payload = {
            teamId: workspace.selectedTeamId,
            schemeId: formValue.schemeId,
            sport: formValue.sport,
            name: formValue.name.trim(),
            description: formValue.description.trim(),
            sessionType: formValue.sessionType,
            activePillars: formValue.activePillars,
            commentPolicy: formValue.commentPolicy,
            scoringScale: getScoreScaleByValue(formValue.scoringScaleKey),
            defaultObservationTags: [],
            enableComments: formValue.commentPolicy !== "hidden",
            allowQuickAdvance: true,
            mobileLayout: "stacked",
            editWindowMinutes: Number(formValue.editWindowMinutes || 0),
            showLeadershipTags: Boolean(formValue.showLeadershipTags)
        };

        const response = await createEvaluationTemplate(payload);
        setIsSaving(false);

        if (response?.status) {
            CustomToastHandler({ msg: response?.message || "Template saved." });
            setFormValue(createInitialTemplateForm());
            setErrors({});
            const refresh = await fetchEvaluationTemplates(workspace.selectedTeamId);
            if (refresh?.status) {
                setTemplates(refresh?.templates || []);
            }
            return;
        }

        CustomToastHandler({
            msg: response?.message || "Unable to save the template.",
            type: "error"
        });
    };

    return (
        <EvaluationShell
            workspace={workspace}
            title="Template Editor"
            description="Create session templates that inherit weighted pillars from a scheme and lock evaluator-facing defaults for each cycle."
        >
            <div className="evaluation-card">
                <div className="evaluation-formGrid">
                    <div className="evaluation-field">
                        <label>Sport</label>
                        <select
                            value={formValue.sport}
                            onChange={(event) => setFormValue((current) => ({ ...current, sport: event.target.value, schemeId: "", activePillars: [] }))}
                        >
                            <option value="">Select sport</option>
                            {SPORT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {errors.sport ? <span className="text-danger">{errors.sport}</span> : null}
                    </div>

                    <div className="evaluation-field">
                        <label>Linked scheme</label>
                        <select value={formValue.schemeId} onChange={(event) => handleSchemeChange(event.target.value)}>
                            <option value="">Select scheme</option>
                            {filteredSchemes.map((scheme) => (
                                <option key={scheme?._id} value={scheme?._id}>
                                    {scheme?.name}
                                </option>
                            ))}
                        </select>
                        {errors.schemeId ? <span className="text-danger">{errors.schemeId}</span> : null}
                    </div>

                    <div className="evaluation-field">
                        <label>Template name</label>
                        <input
                            type="text"
                            value={formValue.name}
                            onChange={(event) => setFormValue((current) => ({ ...current, name: event.target.value }))}
                            placeholder="Example: U13 Small-Area Evaluation Block"
                        />
                        {errors.name ? <span className="text-danger">{errors.name}</span> : null}
                    </div>

                    <div className="evaluation-field">
                        <label>Session type</label>
                        <select
                            value={formValue.sessionType}
                            onChange={(event) => setFormValue((current) => ({ ...current, sessionType: event.target.value }))}
                        >
                            {SESSION_TYPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="evaluation-field mt-3">
                    <label>Description</label>
                    <textarea
                        rows="3"
                        value={formValue.description}
                        onChange={(event) => setFormValue((current) => ({ ...current, description: event.target.value }))}
                        placeholder="Describe when this session template should be used."
                    />
                </div>

                <div className="evaluation-card mt-4">
                    <p className="evaluation-card__eyebrow">Active pillars from the selected scheme</p>
                    <h3>Pillars must come from the scheme categories</h3>
                    <div className="evaluation-checkboxGrid">
                        {(selectedScheme?.categories || []).map((category) => (
                            <label key={category?.key} className="evaluation-checkbox">
                                <input
                                    type="checkbox"
                                    checked={formValue.activePillars.includes(category?.key)}
                                    onChange={() => togglePillar(category?.key)}
                                />
                                <span>
                                    <strong>{category?.label}</strong>
                                    <small>{category?.description || "No description"}</small>
                                </span>
                            </label>
                        ))}
                    </div>
                    {errors.activePillars ? <span className="text-danger">{errors.activePillars}</span> : null}
                </div>

                <div className="evaluation-formGrid mt-4">
                    <div className="evaluation-field">
                        <label>Comment policy</label>
                        <select
                            value={formValue.commentPolicy}
                            onChange={(event) => setFormValue((current) => ({ ...current, commentPolicy: event.target.value }))}
                        >
                            {COMMENT_POLICY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="evaluation-field">
                        <label>Scoring scale</label>
                        <select
                            value={formValue.scoringScaleKey}
                            onChange={(event) => setFormValue((current) => ({ ...current, scoringScaleKey: event.target.value }))}
                        >
                            {SCORING_SCALE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="evaluation-field">
                        <label>Edit window (minutes)</label>
                        <input
                            type="number"
                            min="0"
                            value={formValue.editWindowMinutes}
                            onChange={(event) => setFormValue((current) => ({ ...current, editWindowMinutes: event.target.value }))}
                        />
                    </div>

                    <div className="evaluation-field">
                        <label>Leadership tags</label>
                        <div className="evaluation-toggleRow">
                            <input
                                type="checkbox"
                                checked={formValue.showLeadershipTags}
                                onChange={(event) => setFormValue((current) => ({ ...current, showLeadershipTags: event.target.checked }))}
                            />
                            <span>Default OFF. Do not expose leadership / captain tags to evaluators unless explicitly enabled.</span>
                        </div>
                    </div>
                </div>

                <div className="evaluation-actionRow">
                    <button type="button" className="orange_small_primary" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving…" : "Save template"}
                    </button>
                </div>
            </div>

            <div className="evaluation-card">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <p className="evaluation-card__eyebrow">Saved templates</p>
                        <h3>Session template library</h3>
                    </div>
                    <span className="evaluation-meta">{templates.length} saved</span>
                </div>
                <div className="evaluation-list">
                    {templates.length ? templates.map((template) => (
                        <div key={template?._id} className="evaluation-listItem">
                            <div>
                                <strong>{template?.name}</strong>
                                <p>
                                    {template?.sessionType || "--"} • {template?.activePillars?.length || 0} active pillars •{" "}
                                    comments {template?.commentPolicy || "optional"}
                                </p>
                            </div>
                            <span className={`evaluation-pill ${template?.showLeadershipTags ? "is-warning" : "is-enabled"}`}>
                                {template?.showLeadershipTags ? "Leadership visible" : "Leadership hidden"}
                            </span>
                        </div>
                    )) : (
                        <div className="evaluation-emptyState">No templates saved for this team yet.</div>
                    )}
                </div>
            </div>
        </EvaluationShell>
    );
};

export default TemplateEditorPage;
