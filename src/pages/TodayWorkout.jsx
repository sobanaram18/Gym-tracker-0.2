import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getTodaySchedule,
    getExerciseById,
    getMuscleGroupById,
    getLastNSessions,
    getLogsByDate,
    getTodayISO,
    isDateSkipped,
    unskipDate,
    skipAndReschedule,
    pushScheduleByOneDay,
    getDateISO,
    formatDate,
    getDayName,
} from '../db/storage';
import { getTrackingConfig } from '../db/seed';
import './TodayWorkout.css';

export default function TodayWorkout() {
    const navigate = useNavigate();
    const [showSkipModal, setShowSkipModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const todayISO = getTodayISO();
    const skipped = isDateSkipped(todayISO);
    const todayExerciseIds = getTodaySchedule();
    const todayLogs = getLogsByDate(todayISO);
    const loggedExerciseIds = new Set(todayLogs.map(l => l.exerciseId));

    const exercises = todayExerciseIds.map(id => {
        const ex = getExerciseById(id);
        if (!ex) return null;
        const group = getMuscleGroupById(ex.muscleGroupId);
        const lastSessions = getLastNSessions(id, 1);
        const lastSession = lastSessions[0];
        const isCompleted = loggedExerciseIds.has(id);
        const trackingConfig = getTrackingConfig(ex.trackingType || 'weight_reps');
        return { ...ex, group, lastSession, isCompleted, trackingConfig };
    }).filter(Boolean);

    const handleUnskip = useCallback(() => {
        unskipDate(todayISO);
        setRefreshKey(k => k + 1);
    }, [todayISO]);

    const handleSkipReschedule = useCallback((targetDateISO) => {
        skipAndReschedule(targetDateISO);
        setShowSkipModal(false);
        setRefreshKey(k => k + 1);
    }, []);

    const handlePushSchedule = useCallback(() => {
        pushScheduleByOneDay();
        setShowSkipModal(false);
        setRefreshKey(k => k + 1);
    }, []);

    // Build next 7 days for reschedule picker
    const nextDays = [];
    for (let i = 1; i <= 7; i++) {
        const iso = getDateISO(i);
        const d = new Date(iso + 'T00:00:00');
        nextDays.push({
            iso,
            label: getDayName(d.getDay()),
            dateLabel: formatDate(iso),
        });
    }

    return (
        <div className="page" key={refreshKey}>
            <div className="today-header-row">
                <div>
                    <h1 className="page-title">Today's Workout</h1>
                    <p className="page-subtitle">
                        {skipped
                            ? 'Workout skipped for today'
                            : exercises.length > 0
                                ? `${exercises.length} exercise${exercises.length > 1 ? 's' : ''} planned`
                                : 'Nothing scheduled for today'}
                    </p>
                </div>
                {!skipped && exercises.length > 0 && (
                    <button
                        className="btn btn-sm btn-secondary skip-btn"
                        onClick={() => setShowSkipModal(true)}
                        id="skip-workout-btn"
                    >
                        ⏭ Skip
                    </button>
                )}
            </div>

            {/* Skipped State */}
            {skipped && (
                <div className="glass-card skipped-banner">
                    <div className="skipped-banner-icon">😴</div>
                    <div className="skipped-banner-text">
                        <strong>Rest day!</strong>
                        <span>Today's workout has been skipped and rescheduled.</span>
                    </div>
                    <button className="btn btn-sm btn-secondary" onClick={handleUnskip}>
                        Undo Skip
                    </button>
                </div>
            )}

            {/* Exercise List */}
            {!skipped && exercises.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <p className="empty-state-text">
                        No exercises scheduled for today. Head to the Schedule page to set up your routine.
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/schedule')}
                    >
                        Set Up Schedule
                    </button>
                </div>
            )}

            {!skipped && exercises.length > 0 && (
                <div className="today-exercises">
                    {exercises.map((ex, i) => (
                        <div
                            key={ex.id}
                            className={`glass-card clickable exercise-card ${ex.isCompleted ? 'exercise-card--completed' : ''}`}
                            onClick={() => navigate(`/workout/${ex.id}`)}
                            id={`exercise-card-${i}`}
                            style={{
                                animationDelay: `${i * 0.05}s`,
                                '--group-color': ex.group?.color || 'var(--accent-purple)',
                            }}
                        >
                            <div className="exercise-card-left">
                                <div
                                    className="exercise-card-indicator"
                                    style={{ background: ex.group?.color || 'var(--accent-purple)' }}
                                />
                                <div className="exercise-card-info">
                                    <h3 className="exercise-card-name">{ex.name}</h3>
                                    <span className="exercise-card-group">{ex.group?.name || 'Unknown'}</span>
                                </div>
                            </div>
                            <div className="exercise-card-right">
                                {ex.isCompleted && (
                                    <span className="exercise-card-check">✓</span>
                                )}
                                {ex.lastSession && (
                                    <div className="exercise-card-last">
                                        <span className="exercise-card-last-label">Last</span>
                                        <span className="exercise-card-last-value">
                                            {ex.trackingConfig.summary(ex.lastSession.sets[0])}
                                        </span>
                                    </div>
                                )}
                                <span className="exercise-card-arrow">›</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Skip / Reschedule Modal */}
            {showSkipModal && (
                <div className="modal-overlay" onClick={() => setShowSkipModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Skip Today's Workout</h2>
                            <button className="btn-icon" onClick={() => setShowSkipModal(false)}>✕</button>
                        </div>

                        <p className="skip-modal-desc">
                            Choose how you'd like to reschedule:
                        </p>

                        {/* Option 1: Reschedule to specific day */}
                        <div className="skip-option">
                            <h3 className="skip-option-title">📅 Reschedule to another day</h3>
                            <p className="skip-option-desc">Move today's exercises to a specific day</p>
                            <div className="skip-day-picker">
                                {nextDays.map(day => (
                                    <button
                                        key={day.iso}
                                        className="btn btn-secondary btn-sm skip-day-btn"
                                        onClick={() => handleSkipReschedule(day.iso)}
                                    >
                                        <span className="skip-day-name">{day.label}</span>
                                        <span className="skip-day-date">{day.dateLabel}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="divider" />

                        {/* Option 2: Push entire schedule */}
                        <div className="skip-option">
                            <h3 className="skip-option-title">⏩ Push entire schedule by 1 day</h3>
                            <p className="skip-option-desc">
                                Shifts all recurring days forward (Mon→Tue, Tue→Wed, etc.)
                            </p>
                            <button
                                className="btn btn-danger btn-block"
                                onClick={handlePushSchedule}
                                id="push-schedule-btn"
                            >
                                Push Schedule Forward
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
