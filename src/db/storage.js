import { v4 as uuid } from 'uuid';
import { defaultMuscleGroups, generateDefaultExercises } from './seed';

const KEYS = {
    MUSCLE_GROUPS: 'gm_muscle_groups',
    EXERCISES: 'gm_exercises',
    SCHEDULE: 'gm_schedule',
    LOGS: 'gm_logs',
    SKIPPED: 'gm_skipped',
    INITIALIZED: 'gm_initialized',
};

// ─── Helpers ──────────────────────────────────────────────
function read(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function write(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// ─── Initialization ───────────────────────────────────────
export function initializeData() {
    if (localStorage.getItem(KEYS.INITIALIZED)) return;

    const groups = defaultMuscleGroups;
    const exercises = generateDefaultExercises(groups);

    write(KEYS.MUSCLE_GROUPS, groups);
    write(KEYS.EXERCISES, exercises);
    write(KEYS.SCHEDULE, []);
    write(KEYS.LOGS, []);
    write(KEYS.SKIPPED, []);
    localStorage.setItem(KEYS.INITIALIZED, 'true');
}

// ─── Muscle Groups ────────────────────────────────────────
export function getMuscleGroups() {
    return read(KEYS.MUSCLE_GROUPS);
}

export function getMuscleGroupById(id) {
    return getMuscleGroups().find(g => g.id === id) || null;
}

// ─── Exercises ────────────────────────────────────────────
export function getExercises() {
    return read(KEYS.EXERCISES);
}

export function getExerciseById(id) {
    return getExercises().find(e => e.id === id) || null;
}

export function getExercisesByGroup(muscleGroupId) {
    return getExercises().filter(e => e.muscleGroupId === muscleGroupId);
}

export function addExercise(name, muscleGroupId, trackingType = 'weight_reps') {
    const exercises = getExercises();
    const newEx = { id: uuid(), name, muscleGroupId, isCustom: true, trackingType };
    exercises.push(newEx);
    write(KEYS.EXERCISES, exercises);
    return newEx;
}

export function deleteExercise(id) {
    const exercises = getExercises().filter(e => e.id !== id);
    write(KEYS.EXERCISES, exercises);
    // Also remove from schedules
    const schedules = getSchedules();
    schedules.forEach(s => {
        s.exerciseIds = s.exerciseIds.filter(eid => eid !== id);
    });
    write(KEYS.SCHEDULE, schedules);
}

// ─── Schedule ─────────────────────────────────────────────
/*
  Schedule model:
  {
    id, exerciseIds[],
    // Recurrence type: 'weekly' | 'biweekly' | 'every_n_days' | 'monthly' | 'one_off'
    recurrence: 'weekly',
    dayOfWeek: 0-6 | null,       // for weekly/biweekly
    date: ISO | null,            // for one_off or as the start date for every_n_days
    intervalDays: number | null, // for every_n_days
    startDate: ISO | null,       // anchor date for biweekly / every_n_days
  }
*/
export function getSchedules() {
    return read(KEYS.SCHEDULE);
}

export function getScheduleForDay(dayOfWeek) {
    return getSchedules().filter(s =>
        (s.recurrence === 'weekly' || !s.recurrence) && s.dayOfWeek === dayOfWeek
    );
}

export function getScheduleForDate(dateISO) {
    return getSchedules().filter(s =>
        (s.recurrence === 'one_off' || (!s.recurrence && s.date)) && s.date === dateISO
    );
}

/**
 * Get all exercise IDs that apply to a specific date,
 * evaluating all recurrence rules.
 */
export function getExerciseIdsForDate(dateISO) {
    const schedules = getSchedules();
    const targetDate = new Date(dateISO + 'T00:00:00');
    const targetDay = targetDate.getDay();
    const allIds = new Set();

    schedules.forEach(s => {
        const recurrence = s.recurrence || (s.date ? 'one_off' : 'weekly');

        switch (recurrence) {
            case 'weekly':
                if (s.dayOfWeek === targetDay) {
                    s.exerciseIds.forEach(id => allIds.add(id));
                }
                break;

            case 'biweekly':
                if (s.dayOfWeek === targetDay && s.startDate) {
                    const start = new Date(s.startDate + 'T00:00:00');
                    const diffDays = Math.round((targetDate - start) / 86400000);
                    const diffWeeks = Math.floor(diffDays / 7);
                    if (diffWeeks >= 0 && diffWeeks % 2 === 0) {
                        s.exerciseIds.forEach(id => allIds.add(id));
                    }
                }
                break;

            case 'every_n_days':
                if (s.startDate && s.intervalDays > 0) {
                    const start = new Date(s.startDate + 'T00:00:00');
                    const diffDays = Math.round((targetDate - start) / 86400000);
                    if (diffDays >= 0 && diffDays % s.intervalDays === 0) {
                        s.exerciseIds.forEach(id => allIds.add(id));
                    }
                }
                break;

            case 'monthly':
                if (s.dayOfMonth) {
                    const dom = targetDate.getDate();
                    if (dom === s.dayOfMonth) {
                        s.exerciseIds.forEach(id => allIds.add(id));
                    }
                }
                break;

            case 'one_off':
                if (s.date === dateISO) {
                    s.exerciseIds.forEach(id => allIds.add(id));
                }
                break;
        }
    });

    return Array.from(allIds);
}

export function getTodaySchedule() {
    const dateISO = new Date().toISOString().split('T')[0];

    // If today is skipped, return empty
    if (isDateSkipped(dateISO)) return [];

    return getExerciseIdsForDate(dateISO);
}

export function addScheduleEntry(entry) {
    const schedules = getSchedules();
    schedules.push({ id: uuid(), ...entry });
    write(KEYS.SCHEDULE, schedules);
}

export function removeScheduleEntry(scheduleId) {
    const schedules = getSchedules().filter(s => s.id !== scheduleId);
    write(KEYS.SCHEDULE, schedules);
}

export function setScheduleForDay(dayOfWeek, exerciseIds, recurrence = 'weekly', options = {}) {
    let schedules = getSchedules();
    // Remove existing weekly/biweekly for this day
    schedules = schedules.filter(s =>
        !(s.dayOfWeek === dayOfWeek && (s.recurrence === 'weekly' || s.recurrence === 'biweekly' || !s.recurrence) && !s.date)
    );

    if (exerciseIds.length > 0) {
        schedules.push({
            id: uuid(),
            dayOfWeek,
            date: null,
            exerciseIds,
            recurrence,
            startDate: options.startDate || new Date().toISOString().split('T')[0],
            intervalDays: options.intervalDays || null,
            dayOfMonth: options.dayOfMonth || null,
        });
    }

    write(KEYS.SCHEDULE, schedules);
}

export function setScheduleForDate(dateISO, exerciseIds) {
    let schedules = getSchedules();
    // Remove existing one-off for this date
    schedules = schedules.filter(s => !(s.date === dateISO && (s.recurrence === 'one_off' || !s.recurrence)));

    if (exerciseIds.length > 0) {
        schedules.push({
            id: uuid(),
            dayOfWeek: null,
            date: dateISO,
            exerciseIds,
            recurrence: 'one_off',
        });
    }

    write(KEYS.SCHEDULE, schedules);
}

// ─── Logs ─────────────────────────────────────────────────
export function getLogs() {
    return read(KEYS.LOGS);
}

export function getLogsByExercise(exerciseId) {
    return getLogs()
        .filter(l => l.exerciseId === exerciseId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getLogsByDate(dateISO) {
    return getLogs().filter(l => l.date === dateISO);
}

export function getLastNSessions(exerciseId, n = 3) {
    return getLogsByExercise(exerciseId).slice(0, n);
}

export function addLog(exerciseId, sets, customDateISO = null) {
    const logs = getLogs();
    const dateISO = customDateISO || new Date().toISOString().split('T')[0];

    // Check if there's already a log for this exercise on this date
    const existingIdx = logs.findIndex(
        l => l.exerciseId === exerciseId && l.date === dateISO
    );

    if (existingIdx !== -1) {
        // Append sets to existing log
        logs[existingIdx].sets = [...logs[existingIdx].sets, ...sets];
    } else {
        logs.push({
            id: uuid(),
            exerciseId,
            date: dateISO,
            sets,
        });
    }

    write(KEYS.LOGS, logs);
}

export function deleteLog(logId) {
    const logs = getLogs().filter(l => l.id !== logId);
    write(KEYS.LOGS, logs);
}

// ─── Streak ───────────────────────────────────────────────
export function getStreak() {
    const logs = getLogs();
    if (logs.length === 0) return 0;

    const uniqueDates = [...new Set(logs.map(l => l.date))].sort().reverse();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let checkDate = new Date(today);

    // If no workout today, start checking from yesterday
    const todayISO = today.toISOString().split('T')[0];
    if (!uniqueDates.includes(todayISO)) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    for (let i = 0; i < 365; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (uniqueDates.includes(dateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

// ─── Skip / Reschedule ────────────────────────────────────
function getSkippedDates() {
    try {
        const raw = localStorage.getItem(KEYS.SKIPPED);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function isDateSkipped(dateISO) {
    return getSkippedDates().includes(dateISO);
}

function addSkippedDate(dateISO) {
    const skipped = getSkippedDates();
    if (!skipped.includes(dateISO)) {
        skipped.push(dateISO);
        write(KEYS.SKIPPED, skipped);
    }
}

export function unskipDate(dateISO) {
    const skipped = getSkippedDates().filter(d => d !== dateISO);
    write(KEYS.SKIPPED, skipped);
}

/**
 * Skip today's workout and reschedule it to a specific target date.
 * Copies today's recurring exercises as a one-off on the target date.
 */
export function skipAndReschedule(targetDateISO) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const todayISO = today.toISOString().split('T')[0];

    // Get today's exercise IDs
    const recurring = getScheduleForDay(dayOfWeek);
    const oneOff = getScheduleForDate(todayISO);
    const allIds = new Set();
    [...recurring, ...oneOff].forEach(s => {
        s.exerciseIds.forEach(id => allIds.add(id));
    });

    if (allIds.size === 0) return;

    // Mark today as skipped
    addSkippedDate(todayISO);

    // Add one-off schedule on target date (merge with existing)
    const existingTarget = getScheduleForDate(targetDateISO);
    const existingIds = new Set();
    existingTarget.forEach(s => s.exerciseIds.forEach(id => existingIds.add(id)));
    allIds.forEach(id => existingIds.add(id));

    setScheduleForDate(targetDateISO, Array.from(existingIds));
}

/**
 * Skip today and push the entire weekly schedule forward by one day.
 * Mon→Tue, Tue→Wed, ... Sat→Sun, Sun→Mon
 */
export function pushScheduleByOneDay() {
    const todayISO = new Date().toISOString().split('T')[0];
    addSkippedDate(todayISO);

    const schedules = getSchedules();
    const updated = schedules.map(s => {
        if (s.dayOfWeek !== null && s.date === null) {
            return { ...s, dayOfWeek: (s.dayOfWeek + 1) % 7 };
        }
        return s;
    });
    write(KEYS.SCHEDULE, updated);
}

// ─── Utils ────────────────────────────────────────────────
export function getTodayISO() {
    return new Date().toISOString().split('T')[0];
}

export function getDayName(dayOfWeek) {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
}

export function getDayShort(dayOfWeek) {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek];
}

export function formatDate(dateISO) {
    const d = new Date(dateISO + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getDateISO(daysFromToday) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    return d.toISOString().split('T')[0];
}
