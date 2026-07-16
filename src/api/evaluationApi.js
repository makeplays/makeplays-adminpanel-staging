import axios from "../config/axios";
import crypto from "../config/crypto";
import { Customdecryptdata, Customencryptdata } from "../lib/CustomData";
import { logoutUser } from "../lib/localStorage";

const secretKey = crypto.cryptoSecretKey;

const decryptPayload = (payload) => {
    try {
        if (payload && typeof payload === "object" && Object.prototype.hasOwnProperty.call(payload, "status")) {
            return payload;
        }

        return Customdecryptdata(payload, secretKey) || {};
    } catch (error) {
        console.log("decryptPayload__error", error);
        return {};
    }
};

const normalizePayload = (payload) => {
    const decrypted = decryptPayload(payload);
    if (decrypted && typeof decrypted === "object" && !Object.prototype.hasOwnProperty.call(decrypted, "status")) {
        return {
            status: true,
            ...decrypted
        };
    }

    return decrypted;
};

const buildErrorResponse = (error) => {
    if (error?.response?.status === 401 || error?.status === 401) {
        logoutUser();
        return {
            status: false,
            message: "Your session expired. Please sign in again."
        };
    }

    const decryptedError = decryptPayload(error?.response?.data);
    return {
        status: false,
        message: decryptedError?.message || error?.message || "Something went wrong."
    };
};

const encryptedRequest = async ({ url, method = "GET", data, params }) => {
    try {
        const response = await axios({
            url,
            method,
            params,
            data: data !== undefined ? { token: Customencryptdata(data, secretKey) } : undefined
        });
        return normalizePayload(response?.data);
    } catch (error) {
        return buildErrorResponse(error);
    }
};

const plainRequest = async ({ url, method = "GET", data, params }) => {
    try {
        const response = await axios({
            url,
            method,
            params,
            data
        });
        return normalizePayload(response?.data);
    } catch (error) {
        return buildErrorResponse(error);
    }
};

export const createEvaluationScheme = async (payload) => {
    return encryptedRequest({
        url: "/user/evaluation/scheme",
        method: "POST",
        data: payload
    });
};

export const fetchEvaluationSchemes = async (teamId) => {
    return plainRequest({
        url: `/user/evaluation/scheme/team/${teamId}`,
        method: "GET"
    });
};

export const createEvaluationTemplate = async (payload) => {
    return encryptedRequest({
        url: "/user/evaluation/template",
        method: "POST",
        data: payload
    });
};

export const fetchEvaluationTemplates = async (teamId) => {
    return plainRequest({
        url: `/user/evaluation/template/team/${teamId}`,
        method: "GET"
    });
};

export const createEvaluationCycle = async (payload) => {
    return encryptedRequest({
        url: "/user/evaluation/cycle",
        method: "POST",
        data: payload
    });
};

export const fetchEvaluationCycles = async (teamId) => {
    return plainRequest({
        url: `/user/evaluation/cycle/team/${teamId}`,
        method: "GET"
    });
};

export const createEvaluationSession = async (payload) => {
    return encryptedRequest({
        url: "/user/evaluation/session",
        method: "POST",
        data: payload
    });
};

export const fetchEvaluationSessions = async (cycleId) => {
    return plainRequest({
        url: `/user/evaluation/session/cycle/${cycleId}`,
        method: "GET"
    });
};

export const createEvaluationAssignment = async (payload) => {
    return encryptedRequest({
        url: "/user/evaluation/assignment",
        method: "POST",
        data: payload
    });
};

export const fetchEvaluationAssignmentsBySession = async (sessionId) => {
    return plainRequest({
        url: `/user/evaluation/assignment/session/${sessionId}`,
        method: "GET"
    });
};

export const fetchEvaluationReviewDashboard = async (cycleId) => {
    return plainRequest({
        url: `/user/evaluation/review/cycle/${cycleId}/dashboard`,
        method: "GET"
    });
};

export const fetchEvaluationPlayerReview = async (cycleId, playerMemberId) => {
    return plainRequest({
        url: `/user/evaluation/review/cycle/${cycleId}/player/${playerMemberId}`,
        method: "GET"
    });
};

export const createEvaluationOutcome = async (payload) => {
    return encryptedRequest({
        url: "/user/evaluation/outcome",
        method: "POST",
        data: payload
    });
};

export const finalizeEvaluationOutcome = async (outcomeId, payload = {}) => {
    return plainRequest({
        url: `/user/evaluation/outcome/${outcomeId}/finalize`,
        method: "PATCH",
        data: payload
    });
};

export const releaseEvaluationOutcomeToParents = async (outcomeId) => {
    return plainRequest({
        url: `/user/evaluation/outcome/${outcomeId}/release`,
        method: "PATCH"
    });
};

export const updateEvaluationOutcomeHandoff = async (outcomeId, payload) => {
    return encryptedRequest({
        url: `/user/evaluation/outcome/${outcomeId}/handoff`,
        method: "PATCH",
        data: payload
    });
};

export const listRegistrationFormsByTeam = async (teamId) => {
    return plainRequest({
        url: `/user/registration/forms/team/${teamId}`,
        method: "GET"
    });
};
