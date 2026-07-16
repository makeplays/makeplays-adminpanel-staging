import { useEffect, useMemo, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { listAllTeams } from "../../api/teamApi";
import {
    getEnabledEvaluationTeamIds,
    getEvaluationFeatureSource
} from "../../lib/evaluationModule";

const buildSearchString = (currentSearch, updates = {}) => {
    const params = new URLSearchParams(currentSearch);

    Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
            params.delete(key);
            return;
        }

        params.set(key, value);
    });

    const search = params.toString();
    return search ? `?${search}` : "";
};

export const useEvaluationWorkspace = () => {
    const history = useHistory();
    const location = useLocation();
    const query = useMemo(() => new URLSearchParams(location.search), [location.search]);

    const [teams, setTeams] = useState([]);
    const [isLoadingTeams, setIsLoadingTeams] = useState(true);
    const [teamError, setTeamError] = useState("");
    const [accessRevision, setAccessRevision] = useState(0);

    const selectedTeamId = query.get("teamId") || "";
    const selectedCycleId = query.get("cycleId") || "";

    useEffect(() => {
        let isMounted = true;

        const loadTeams = async () => {
            setIsLoadingTeams(true);
            setTeamError("");

            const response = await listAllTeams();
            if (!isMounted) {
                return;
            }

            if (response?.status) {
                setTeams(response?.result || []);
            } else {
                setTeamError(response?.message || "Unable to load teams.");
            }

            setIsLoadingTeams(false);
        };

        loadTeams();

        return () => {
            isMounted = false;
        };
    }, []);

    const selectedTeam = useMemo(() => {
        return teams.find((team) => team?._id === selectedTeamId) || null;
    }, [teams, selectedTeamId]);

    const enabledTeamIds = useMemo(() => {
        return getEnabledEvaluationTeamIds(teams);
    }, [teams, accessRevision]);

    const featureSource = useMemo(() => {
        return getEvaluationFeatureSource(selectedTeam);
    }, [selectedTeam, accessRevision]);

    const canAccessModule = Boolean(selectedTeam && featureSource.enabled);

    useEffect(() => {
        if (isLoadingTeams || selectedTeamId || teams.length === 0) {
            return;
        }

        const nextTeamId = enabledTeamIds[0] || teams?.[0]?._id || "";
        if (!nextTeamId) {
            return;
        }

        history.replace(`${location.pathname}${buildSearchString(location.search, { teamId: nextTeamId })}`);
    }, [enabledTeamIds, history, isLoadingTeams, location.pathname, location.search, selectedTeamId, teams]);

    const updateQuery = (updates, options = {}) => {
        const nextSearch = buildSearchString(location.search, updates);
        const nextUrl = `${location.pathname}${nextSearch}`;

        if (options?.replace) {
            history.replace(nextUrl);
            return;
        }

        history.push(nextUrl);
    };

    const setSelectedTeam = (teamId) => {
        updateQuery({ teamId, cycleId: "" });
    };

    const setSelectedCycle = (cycleId) => {
        updateQuery({ cycleId });
    };

    const buildRoute = (path, overrides = {}) => {
        const nextSearch = buildSearchString(location.search, overrides);
        return `${path}${nextSearch}`;
    };

    return {
        teams,
        selectedTeam,
        selectedTeamId,
        selectedCycleId,
        enabledTeamIds,
        canAccessModule,
        featureSource,
        isLoadingTeams,
        teamError,
        location,
        query,
        updateQuery,
        setSelectedTeam,
        setSelectedCycle,
        buildRoute,
        refreshModuleAccess: () => setAccessRevision((current) => current + 1)
    };
};
