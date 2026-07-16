const STORAGE_KEY = "makeplays:sports-evaluation:module-access";

const parseStoredMap = () => {
    if (typeof window === "undefined") {
        return {};
    }

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return {};
        }

        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
        console.log("parseStoredMap__error", error);
        return {};
    }
};

const writeStoredMap = (nextValue) => {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextValue));
};

export const getEvaluationFeatureSource = (team) => {
    if (!team) {
        return { enabled: false, source: "missing" };
    }

    const directFlags = [
        team?.sportsEvaluationEnabled,
        team?.sportsEvaluation?.enabled,
        team?.features?.sportsEvaluation,
        team?.features?.sportsEvaluationEnabled,
        team?.modules?.sportsEvaluation,
        team?.modules?.sportsEvaluationEnabled,
        team?.orgId?.sportsEvaluationEnabled,
        team?.orgId?.features?.sportsEvaluation,
        team?.orgId?.modules?.sportsEvaluation,
    ];

    const resolvedDirectFlag = directFlags.find((value) => typeof value === "boolean");
    if (typeof resolvedDirectFlag === "boolean") {
        return {
            enabled: resolvedDirectFlag,
            source: "backend"
        };
    }

    const localMap = parseStoredMap();
    return {
        enabled: Boolean(localMap?.[team?._id]),
        source: "local"
    };
};

export const isEvaluationModuleEnabled = (team) => {
    return getEvaluationFeatureSource(team).enabled;
};

export const setEvaluationModuleEnabled = (teamId, enabled) => {
    if (!teamId) {
        return;
    }

    const current = parseStoredMap();
    const nextValue = {
        ...current,
        [teamId]: Boolean(enabled)
    };
    writeStoredMap(nextValue);
};

export const getEnabledEvaluationTeamIds = (teams = []) => {
    return teams.filter((team) => isEvaluationModuleEnabled(team)).map((team) => team?._id).filter(Boolean);
};

export const hasEnabledEvaluationTeams = (teams = []) => {
    return getEnabledEvaluationTeamIds(teams).length > 0;
};

export const getStoredEvaluationModuleMap = () => {
    return parseStoredMap();
};
