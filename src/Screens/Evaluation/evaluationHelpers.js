export const SPORT_OPTIONS = [
    { value: "hockey", label: "Hockey" },
    { value: "ringette", label: "Ringette" },
    { value: "baseball", label: "Baseball" },
    { value: "basketball", label: "Basketball" },
    { value: "soccer", label: "Soccer" },
    { value: "volleyball", label: "Volleyball" }
];

export const SESSION_TYPE_OPTIONS = [
    { value: "evaluation", label: "Evaluation Session" },
    { value: "tryouts", label: "Tryouts" },
    { value: "id_skates", label: "ID Skates / Skills" },
    { value: "scrimmage", label: "Scrimmage" }
];

export const COMMENT_POLICY_OPTIONS = [
    { value: "optional", label: "Optional comments" },
    { value: "required", label: "Required comments" },
    { value: "hidden", label: "No evaluator comments" }
];

export const SCORING_SCALE_OPTIONS = [
    {
        value: "standard-5",
        label: "1 to 5 (step 1)",
        scale: { min: 1, max: 5, step: 1 }
    },
    {
        value: "extended-10",
        label: "1 to 10 (step 1)",
        scale: { min: 1, max: 10, step: 1 }
    },
    {
        value: "half-step-5",
        label: "1 to 5 (step 0.5)",
        scale: { min: 1, max: 5, step: 0.5 }
    }
];

export const OUTCOME_STATE_OPTIONS = [
    { value: "assigned", label: "Assigned" },
    { value: "pending_review", label: "Pending Review" },
    { value: "waitlisted", label: "Waitlisted" },
    { value: "redirected", label: "Redirected" },
    { value: "not_selected", label: "Not Selected" },
    { value: "withdrawn", label: "Withdrawn" }
];

export const HANDOFF_STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "ready", label: "Ready" },
    { value: "complete", label: "Complete" }
];

const PRESET_LIBRARY = {
    hockey: {
        balanced: [
            { label: "Skating", description: "Stride quality, edge work, acceleration.", weight: 30 },
            { label: "Puck Skills", description: "Hands, passing touch, puck protection.", weight: 25 },
            { label: "Hockey IQ", description: "Reads, support habits, decision-making.", weight: 20 },
            { label: "Compete", description: "Pace, battle level, consistency.", weight: 15 },
            { label: "Team Play", description: "Bench habits, communication, structure.", weight: 10 }
        ],
        skill_focus: [
            { label: "Skating", description: "Stride quality, edge work, acceleration.", weight: 25 },
            { label: "Puck Skills", description: "Hands, passing touch, puck protection.", weight: 35 },
            { label: "Hockey IQ", description: "Reads, support habits, decision-making.", weight: 20 },
            { label: "Compete", description: "Pace, battle level, consistency.", weight: 10 },
            { label: "Coachability", description: "Response to feedback and structure.", weight: 10 }
        ],
        compete_focus: [
            { label: "Skating", description: "Stride quality, edge work, acceleration.", weight: 25 },
            { label: "Puck Skills", description: "Hands, passing touch, puck protection.", weight: 20 },
            { label: "Hockey IQ", description: "Reads, support habits, decision-making.", weight: 20 },
            { label: "Compete", description: "Pace, battle level, consistency.", weight: 25 },
            { label: "Team Play", description: "Bench habits, communication, structure.", weight: 10 }
        ]
    },
    ringette: {
        balanced: [
            { label: "Skating", description: "Stride quality, balance, edge control.", weight: 30 },
            { label: "Ring Control", description: "Pickup, carry, passing, release.", weight: 25 },
            { label: "Game Read", description: "Open ice reads and timing.", weight: 20 },
            { label: "Compete", description: "Pace, battle level, consistency.", weight: 15 },
            { label: "Support Play", description: "Team routes, communication, shape.", weight: 10 }
        ],
        skill_focus: [
            { label: "Skating", description: "Stride quality, balance, edge control.", weight: 25 },
            { label: "Ring Control", description: "Pickup, carry, passing, release.", weight: 35 },
            { label: "Game Read", description: "Open ice reads and timing.", weight: 20 },
            { label: "Compete", description: "Pace, battle level, consistency.", weight: 10 },
            { label: "Coachability", description: "Response to structure and instruction.", weight: 10 }
        ],
        compete_focus: [
            { label: "Skating", description: "Stride quality, balance, edge control.", weight: 25 },
            { label: "Ring Control", description: "Pickup, carry, passing, release.", weight: 20 },
            { label: "Game Read", description: "Open ice reads and timing.", weight: 20 },
            { label: "Compete", description: "Pace, battle level, consistency.", weight: 25 },
            { label: "Support Play", description: "Team routes, communication, shape.", weight: 10 }
        ]
    },
    baseball: {
        balanced: [
            { label: "Hitting", description: "Approach, contact quality, swing decisions.", weight: 25 },
            { label: "Fielding", description: "Hands, reads, footwork.", weight: 20 },
            { label: "Throwing", description: "Arm action, accuracy, carry.", weight: 20 },
            { label: "Baseball IQ", description: "Reads, spacing, game awareness.", weight: 20 },
            { label: "Hustle", description: "Motor, competitiveness, response speed.", weight: 15 }
        ],
        skill_focus: [
            { label: "Hitting", description: "Approach, contact quality, swing decisions.", weight: 35 },
            { label: "Fielding", description: "Hands, reads, footwork.", weight: 20 },
            { label: "Throwing", description: "Arm action, accuracy, carry.", weight: 20 },
            { label: "Baseball IQ", description: "Reads, spacing, game awareness.", weight: 15 },
            { label: "Coachability", description: "Adjustments, feedback response.", weight: 10 }
        ],
        compete_focus: [
            { label: "Hitting", description: "Approach, contact quality, swing decisions.", weight: 20 },
            { label: "Fielding", description: "Hands, reads, footwork.", weight: 20 },
            { label: "Throwing", description: "Arm action, accuracy, carry.", weight: 20 },
            { label: "Baseball IQ", description: "Reads, spacing, game awareness.", weight: 20 },
            { label: "Hustle", description: "Motor, competitiveness, response speed.", weight: 20 }
        ]
    },
    basketball: {
        balanced: [
            { label: "Ball Handling", description: "Control, pressure management, starts.", weight: 25 },
            { label: "Shooting", description: "Form, touch, shot quality.", weight: 25 },
            { label: "Defense", description: "Containment, stance, effort.", weight: 20 },
            { label: "Court Vision", description: "Reads, spacing, timing.", weight: 15 },
            { label: "Motor", description: "Compete level and consistency.", weight: 15 }
        ],
        skill_focus: [
            { label: "Ball Handling", description: "Control, pressure management, starts.", weight: 30 },
            { label: "Shooting", description: "Form, touch, shot quality.", weight: 30 },
            { label: "Defense", description: "Containment, stance, effort.", weight: 15 },
            { label: "Court Vision", description: "Reads, spacing, timing.", weight: 15 },
            { label: "Coachability", description: "Adjustments and learning habits.", weight: 10 }
        ],
        compete_focus: [
            { label: "Ball Handling", description: "Control, pressure management, starts.", weight: 20 },
            { label: "Shooting", description: "Form, touch, shot quality.", weight: 20 },
            { label: "Defense", description: "Containment, stance, effort.", weight: 25 },
            { label: "Court Vision", description: "Reads, spacing, timing.", weight: 15 },
            { label: "Motor", description: "Compete level and consistency.", weight: 20 }
        ]
    },
    soccer: {
        balanced: [
            { label: "Ball Control", description: "First touch, receiving, composure.", weight: 25 },
            { label: "Passing", description: "Decision quality and execution.", weight: 20 },
            { label: "Decision Making", description: "Awareness, support angles, timing.", weight: 20 },
            { label: "Pace", description: "Quickness, recovery runs, repeat efforts.", weight: 20 },
            { label: "Compete", description: "Work rate and pressure habits.", weight: 15 }
        ],
        skill_focus: [
            { label: "Ball Control", description: "First touch, receiving, composure.", weight: 30 },
            { label: "Passing", description: "Decision quality and execution.", weight: 25 },
            { label: "Decision Making", description: "Awareness, support angles, timing.", weight: 20 },
            { label: "Pace", description: "Quickness, recovery runs, repeat efforts.", weight: 15 },
            { label: "Coachability", description: "Response to structure and feedback.", weight: 10 }
        ],
        compete_focus: [
            { label: "Ball Control", description: "First touch, receiving, composure.", weight: 20 },
            { label: "Passing", description: "Decision quality and execution.", weight: 20 },
            { label: "Decision Making", description: "Awareness, support angles, timing.", weight: 20 },
            { label: "Pace", description: "Quickness, recovery runs, repeat efforts.", weight: 20 },
            { label: "Compete", description: "Work rate and pressure habits.", weight: 20 }
        ]
    },
    volleyball: {
        balanced: [
            { label: "Serve / Receive", description: "Serve pressure and passing platform.", weight: 25 },
            { label: "Attacking", description: "Arm swing, timing, approach choices.", weight: 20 },
            { label: "Movement", description: "Base, transition speed, balance.", weight: 20 },
            { label: "Volleyball IQ", description: "Reads, coverage, spacing.", weight: 20 },
            { label: "Compete", description: "Communication and consistency.", weight: 15 }
        ],
        skill_focus: [
            { label: "Serve / Receive", description: "Serve pressure and passing platform.", weight: 30 },
            { label: "Attacking", description: "Arm swing, timing, approach choices.", weight: 25 },
            { label: "Movement", description: "Base, transition speed, balance.", weight: 15 },
            { label: "Volleyball IQ", description: "Reads, coverage, spacing.", weight: 20 },
            { label: "Coachability", description: "Response to correction and structure.", weight: 10 }
        ],
        compete_focus: [
            { label: "Serve / Receive", description: "Serve pressure and passing platform.", weight: 20 },
            { label: "Attacking", description: "Arm swing, timing, approach choices.", weight: 20 },
            { label: "Movement", description: "Base, transition speed, balance.", weight: 20 },
            { label: "Volleyball IQ", description: "Reads, coverage, spacing.", weight: 20 },
            { label: "Compete", description: "Communication and consistency.", weight: 20 }
        ]
    }
};

export const slugify = (value = "") => {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
};

export const calculateTotalWeight = (categories = []) => {
    return categories.reduce((total, category) => total + Number(category?.weight || 0), 0);
};

export const buildCategoriesFromPreset = (sport, presetKey = "balanced") => {
    const fallback = PRESET_LIBRARY?.[sport]?.balanced || PRESET_LIBRARY.hockey.balanced;
    const source = PRESET_LIBRARY?.[sport]?.[presetKey] || fallback;

    return source.map((category, index) => ({
        key: slugify(category.label),
        label: category.label,
        description: category.description,
        weight: category.weight,
        sortOrder: index,
        isDefault: presetKey !== "custom"
    }));
};

export const createBlankCategory = (index = 0) => ({
    key: `category_${index + 1}`,
    label: "",
    description: "",
    weight: 0,
    sortOrder: index,
    isDefault: false
});

export const formatDateLabel = (value) => {
    if (!value) {
        return "--";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "--";
    }

    return new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "short",
        day: "numeric"
    }).format(date);
};

export const formatDateTimeLabel = (value) => {
    if (!value) {
        return "--";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "--";
    }

    return new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    }).format(date);
};

export const getScoreScaleByValue = (value) => {
    const matched = SCORING_SCALE_OPTIONS.find((option) => option.value === value);
    return matched?.scale || SCORING_SCALE_OPTIONS[0].scale;
};

export const getParentSafePreview = (finalState, publicNote) => {
    const safeNote = String(publicNote || "").trim();

    const previewByState = {
        assigned: {
            title: "Placement update available",
            summary: safeNote || "A team placement update is ready. Staff will send the next official roster details separately."
        },
        waitlisted: {
            title: "Waitlist update available",
            summary: safeNote || "A waitlist update is ready. Staff will share the next official update if space opens."
        },
        redirected: {
            title: "Development path update available",
            summary: safeNote || "A development-path update is ready. Staff will share the next recommended step directly."
        },
        not_selected: {
            title: "Cycle update available",
            summary: safeNote || "This evaluation cycle has concluded. Watch for future opportunities and official staff communication."
        },
        withdrawn: {
            title: "Participation update available",
            summary: safeNote || "This evaluation record is marked as withdrawn. Staff can share next-step support if needed."
        },
        pending_review: {
            title: "Evaluation review in progress",
            summary: "Parent-facing updates only appear after the org authority finalizes and explicitly releases them."
        }
    };

    return previewByState?.[finalState] || previewByState.pending_review;
};

export const getOutcomeBadgeClass = (state) => {
    const mapping = {
        assigned: "success",
        waitlisted: "warning",
        redirected: "info",
        not_selected: "danger",
        withdrawn: "secondary",
        pending_review: "dark"
    };

    return mapping?.[state] || "dark";
};
