import React, { useEffect, useMemo, useState } from "react";
import { createEvaluationScheme, fetchEvaluationSchemes } from "../../api/evaluationApi";
import { CustomToastHandler } from "../../hooks/useCustomToast";
import { EvaluationShell } from "./EvaluationShell";
import {
    SPORT_OPTIONS,
    buildCategoriesFromPreset,
    calculateTotalWeight,
    createBlankCategory,
    slugify
} from "./evaluationHelpers";
import { useEvaluationWorkspace } from "./useEvaluationWorkspace";

const PRESET_OPTIONS = [
    { value: "balanced", label: "Balanced preset" },
    { value: "skill_focus", label: "Skills-first preset" },
    { value: "compete_focus", label: "Compete-first preset" },
    { value: "custom", label: "Custom build" }
];

const createInitialForm = () => ({
    sport: "",
    name: "",
    description: "",
    presetType: "balanced",
    categories: [createBlankCategory(0)]
});

export const SchemeBuilderPage = () => {
    const workspace = useEvaluationWorkspace();
    const [formValue, setFormValue] = useState(createInitialForm());
    const [errors, setErrors] = useState({});
    const [existingSchemes, setExistingSchemes] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    const totalWeight = useMemo(() => calculateTotalWeight(formValue.categories), [formValue.categories]);

    useEffect(() => {
        if (!workspace?.selectedTeamId) {
            return;
        }

        const loadSchemes = async () => {
            const response = await fetchEvaluationSchemes(workspace.selectedTeamId);
            if (response?.status) {
                setExistingSchemes(response?.schemes || []);
            }
        };

        loadSchemes();
    }, [workspace?.selectedTeamId]);

    const selectedSportLabel = useMemo(() => {
        return SPORT_OPTIONS.find((option) => option.value === formValue.sport)?.label || "";
    }, [formValue.sport]);

    const applyPreset = (presetType, sportValue = formValue.sport) => {
        if (!sportValue) {
            setErrors((current) => ({
                ...current,
                sport: "Select a sport before applying a weighting preset."
            }));
            return;
        }

        const nextCategories = presetType === "custom"
            ? buildCategoriesFromPreset(sportValue, "balanced")
            : buildCategoriesFromPreset(sportValue, presetType);

        setFormValue((current) => ({
            ...current,
            presetType,
            categories: nextCategories
        }));
        setErrors((current) => ({
            ...current,
            sport: ""
        }));
    };

    const handleCategoryChange = (index, field, value) => {
        const nextCategories = [...formValue.categories];
        nextCategories[index] = {
            ...nextCategories[index],
            [field]: field === "weight" ? Number(value || 0) : value
        };

        if (field === "label") {
            nextCategories[index].key = slugify(value) || `category_${index + 1}`;
        }

        setFormValue((current) => ({
            ...current,
            categories: nextCategories
        }));
    };

    const addCategoryRow = () => {
        setFormValue((current) => ({
            ...current,
            categories: [...current.categories, createBlankCategory(current.categories.length)]
        }));
    };

    const removeCategoryRow = (index) => {
        if (formValue.categories.length === 1) {
            return;
        }

        setFormValue((current) => ({
            ...current,
            categories: current.categories.filter((_, categoryIndex) => categoryIndex !== index)
                .map((category, categoryIndex) => ({
                    ...category,
                    sortOrder: categoryIndex
                }))
        }));
    };

    const validateForm = () => {
        const nextErrors = {};

        if (!formValue.sport) {
            nextErrors.sport = "Sport selection is required. This flow never silently defaults a sport.";
        }
        if (!formValue.name.trim()) {
            nextErrors.name = "Scheme name is required.";
        }
        if (!formValue.categories.length) {
            nextErrors.categories = "At least one category is required.";
        }

        formValue.categories.forEach((category, index) => {
            if (!category.label.trim()) {
                nextErrors[`category_label_${index}`] = "Category label is required.";
            }
        });

        if (Math.round(totalWeight) !== 100) {
            nextErrors.totalWeight = "Category weights must total exactly 100 before saving.";
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
            sport: formValue.sport,
            name: formValue.name.trim(),
            description: formValue.description.trim(),
            presetType: formValue.presetType === "custom" ? "custom" : "default",
            categories: formValue.categories.map((category, index) => ({
                key: slugify(category.label) || category.key || `category_${index + 1}`,
                label: category.label.trim(),
                description: category.description.trim(),
                weight: Number(category.weight || 0),
                sortOrder: index,
                isDefault: formValue.presetType !== "custom"
            })),
            totalWeight: 100
        };

        const response = await createEvaluationScheme(payload);
        setIsSaving(false);

        if (response?.status) {
            CustomToastHandler({ msg: response?.message || "Evaluation scheme saved." });
            setFormValue(createInitialForm());
            setErrors({});
            const refresh = await fetchEvaluationSchemes(workspace.selectedTeamId);
            if (refresh?.status) {
                setExistingSchemes(refresh?.schemes || []);
            }
            return;
        }

        CustomToastHandler({
            msg: response?.message || "Unable to save the scheme.",
            type: "error"
        });
    };

    return (
        <EvaluationShell
            workspace={workspace}
            title="Scheme Builder"
            description="Create weighted scoring frameworks for tryouts and evaluation cycles. A scheme cannot save unless the total weight is exactly 100."
        >
            <div className="evaluation-card">
                <div className="evaluation-formGrid">
                    <div className="evaluation-field">
                        <label>Sport</label>
                        <select
                            value={formValue.sport}
                            onChange={(event) => {
                                const nextSport = event.target.value;
                                setFormValue((current) => ({ ...current, sport: nextSport }));
                            }}
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
                        <label>Scheme name</label>
                        <input
                            type="text"
                            value={formValue.name}
                            onChange={(event) => setFormValue((current) => ({ ...current, name: event.target.value }))}
                            placeholder="Example: U13 Balanced Selection Matrix"
                        />
                        {errors.name ? <span className="text-danger">{errors.name}</span> : null}
                    </div>
                </div>

                <div className="evaluation-field mt-3">
                    <label>Description</label>
                    <textarea
                        rows="3"
                        value={formValue.description}
                        onChange={(event) => setFormValue((current) => ({ ...current, description: event.target.value }))}
                        placeholder="Add a short note about how this scheme should be used."
                    />
                </div>

                <div className="evaluation-toolbar">
                    <div>
                        <p className="evaluation-card__eyebrow">Preset weighting profiles</p>
                        <h3>{selectedSportLabel || "Choose a sport first"}</h3>
                    </div>
                    <div className="evaluation-chipRow">
                        {PRESET_OPTIONS.map((preset) => (
                            <button
                                key={preset.value}
                                type="button"
                                className={`evaluation-chip ${formValue.presetType === preset.value ? "is-selected" : ""}`}
                                onClick={() => applyPreset(preset.value)}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="evaluation-tableWrap">
                    <table className="evaluation-table">
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Weight</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {formValue.categories.map((category, index) => (
                                <tr key={`${category.key}-${index}`}>
                                    <td>
                                        <input
                                            type="text"
                                            value={category.label}
                                            placeholder="Category name"
                                            onChange={(event) => handleCategoryChange(index, "label", event.target.value)}
                                        />
                                        {errors[`category_label_${index}`] ? (
                                            <span className="text-danger">{errors[`category_label_${index}`]}</span>
                                        ) : null}
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            value={category.description}
                                            placeholder="Optional description"
                                            onChange={(event) => handleCategoryChange(index, "description", event.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={category.weight}
                                            onChange={(event) => handleCategoryChange(index, "weight", event.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <button type="button" className="evaluation-inlineLink text-danger" onClick={() => removeCategoryRow(index)}>
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {errors.categories ? <span className="text-danger">{errors.categories}</span> : null}

                <div className="evaluation-toolbar">
                    <button type="button" className="evaluation-inlineLink" onClick={addCategoryRow}>
                        + Add category
                    </button>
                    <div className="evaluation-totalCard">
                        <p>Total weight</p>
                        <strong className={Math.round(totalWeight) === 100 ? "text-success" : "text-warning"}>
                            {totalWeight} / 100
                        </strong>
                    </div>
                </div>

                {errors.totalWeight ? <div className="alert alert-warning mt-3">{errors.totalWeight}</div> : null}

                <div className="evaluation-actionRow">
                    <button
                        type="button"
                        className="orange_small_primary"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? "Saving…" : "Save scheme"}
                    </button>
                </div>
            </div>

            <div className="evaluation-card">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <p className="evaluation-card__eyebrow">Saved schemes</p>
                        <h3>Team library</h3>
                    </div>
                    <span className="evaluation-meta">{existingSchemes.length} saved</span>
                </div>
                <div className="evaluation-list">
                    {existingSchemes.length ? existingSchemes.map((scheme) => (
                        <div key={scheme?._id} className="evaluation-listItem">
                            <div>
                                <strong>{scheme?.name}</strong>
                                <p>{scheme?.sport || "--"} • {scheme?.categories?.length || 0} categories</p>
                            </div>
                            <span className={`evaluation-pill ${Number(scheme?.totalWeight) === 100 ? "is-enabled" : "is-warning"}`}>
                                {scheme?.totalWeight || 0} / 100
                            </span>
                        </div>
                    )) : (
                        <div className="evaluation-emptyState">No schemes saved for this team yet.</div>
                    )}
                </div>
            </div>
        </EvaluationShell>
    );
};

export default SchemeBuilderPage;
