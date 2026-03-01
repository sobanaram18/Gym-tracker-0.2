import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getExerciseById,
    getMuscleGroupById,
    getLastNSessions,
    addLog,
    formatDate,
} from '../db/storage';
import { getTrackingConfig } from '../db/seed';
import './LogWorkout.css';

export default function LogWorkout() {
    const { exerciseId } = useParams();
    const navigate = useNavigate();
    const exercise = getExerciseById(exerciseId);
    const muscleGroup = exercise ? getMuscleGroupById(exercise.muscleGroupId) : null;
    const lastSessions = getLastNSessions(exerciseId, 3);
    const trackingType = exercise?.trackingType || 'weight_reps';
    const trackingConfig = getTrackingConfig(trackingType);

    // Build initial empty set based on tracking fields
    const emptySet = {};
    trackingConfig.fields.forEach(f => { emptySet[f.key] = ''; });

    const [sets, setSets] = useState([{ ...emptySet }]);
    const [saved, setSaved] = useState(false);

    const handleAddSet = useCallback(() => {
        setSets(prev => [...prev, { ...emptySet }]);
    }, [emptySet]);

    const handleRemoveSet = useCallback((index) => {
        setSets(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleChange = useCallback((index, field, value) => {
        setSets(prev => prev.map((s, i) =>
            i === index ? { ...s, [field]: value } : s
        ));
    }, []);

    const handleSave = useCallback(() => {
        const validSets = sets
            .filter(s => trackingConfig.fields.every(f => s[f.key] !== '' && s[f.key] !== undefined))
            .map(s => {
                const parsed = {};
                trackingConfig.fields.forEach(f => {
                    parsed[f.key] = parseFloat(s[f.key]);
                });
                return parsed;
            });

        if (validSets.length === 0) return;

        addLog(exerciseId, validSets);
        setSaved(true);
        setSets([{ ...emptySet }]);

        setTimeout(() => setSaved(false), 2000);
    }, [sets, exerciseId, trackingConfig, emptySet]);

    if (!exercise) {
        return (
            <div className="page">
                <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <p className="empty-state-text">Exercise not found</p>
                    <button className="btn btn-primary" onClick={() => navigate(-1)}>Go Back</button>
                </div>
            </div>
        );
    }

    return (
        <div className="page log-page">
            {/* Back */}
            <div className="back-link" onClick={() => navigate(-1)}>
                ← Back
            </div>

            {/* Header */}
            <div className="log-header">
                <h1 className="page-title">{exercise.name}</h1>
                <span
                    className="badge"
                    style={{
                        background: `${muscleGroup?.color}22`,
                        color: muscleGroup?.color,
                    }}
                >
                    {muscleGroup?.name}
                </span>
            </div>

            {/* Tracking type label */}
            <div className="log-tracking-type">
                <span className="badge badge-purple">📐 {trackingConfig.label}</span>
            </div>

            {/* Previous Sessions */}
            {lastSessions.length > 0 && (
                <div className="log-history">
                    <h2 className="section-title">Recent Sessions</h2>
                    <div className="log-sessions">
                        {lastSessions.map((session, i) => (
                            <div key={session.id} className="glass-card log-session-card" style={{ animationDelay: `${i * 0.05}s` }}>
                                <div className="log-session-date">{formatDate(session.date)}</div>
                                <div className="log-session-sets">
                                    {session.sets.map((set, j) => (
                                        <div key={j} className="log-session-set">
                                            <span className="log-set-number">Set {j + 1}</span>
                                            <span className="log-set-detail">{trackingConfig.summary(set)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Log Form */}
            <div className="log-form-section">
                <div className="section-header">
                    <h2 className="section-title">Log Today's Workout</h2>
                </div>

                <div className="log-sets">
                    {sets.map((set, i) => (
                        <div key={i} className="log-set-row" style={{ animationDelay: `${i * 0.03}s` }}>
                            <span className="log-set-label">
                                {trackingConfig.fields.length === 1 ? '' : `Set ${i + 1}`}
                                {trackingConfig.fields.length === 1 && `#${i + 1}`}
                            </span>
                            <div className="log-set-inputs">
                                {trackingConfig.fields.map((field, fi) => (
                                    <div className="log-input-group" key={field.key}>
                                        {fi > 0 && <span className="log-set-x">·</span>}
                                        <input
                                            type={field.type}
                                            className="input-field log-input"
                                            placeholder="0"
                                            value={set[field.key] || ''}
                                            onChange={(e) => handleChange(i, field.key, e.target.value)}
                                            id={`${field.key}-input-${i}`}
                                            min="0"
                                            step={field.step}
                                        />
                                        <span className="log-input-unit">{field.unit}</span>
                                    </div>
                                ))}
                                {sets.length > 1 && (
                                    <button
                                        className="btn-icon log-remove-btn"
                                        onClick={() => handleRemoveSet(i)}
                                        title="Remove set"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <button className="btn btn-secondary btn-block log-add-set" onClick={handleAddSet} id="add-set-btn">
                    + Add Set
                </button>

                <button
                    className={`btn btn-primary btn-block log-save ${saved ? 'log-save--success' : ''}`}
                    onClick={handleSave}
                    id="save-workout-btn"
                >
                    {saved ? '✓ Saved!' : 'Save Workout'}
                </button>
            </div>

            {/* Link to full history */}
            <div className="log-footer">
                <button
                    className="btn btn-secondary"
                    onClick={() => navigate(`/exercise/${exerciseId}/history`)}
                    id="view-history-btn"
                >
                    📊 View Full History
                </button>
            </div>
        </div>
    );
}
