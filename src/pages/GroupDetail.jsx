import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getMuscleGroupById,
    getExercisesByGroup,
    addExercise,
    deleteExercise,
    getLastNSessions,
} from '../db/storage';
import { getTrackingConfig, TRACKING_FIELDS } from '../db/seed';
import './GroupDetail.css';

const trackingOptions = Object.entries(TRACKING_FIELDS).map(([key, val]) => ({
    value: key,
    label: val.label,
}));

export default function GroupDetail() {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const group = getMuscleGroupById(groupId);
    const [exercises, setExercises] = useState(() => getExercisesByGroup(groupId));
    const [newName, setNewName] = useState('');
    const [newTrackingType, setNewTrackingType] = useState('weight_reps');
    const [showForm, setShowForm] = useState(false);

    const handleAdd = useCallback(() => {
        if (!newName.trim()) return;
        addExercise(newName.trim(), groupId, newTrackingType);
        setExercises(getExercisesByGroup(groupId));
        setNewName('');
        setNewTrackingType('weight_reps');
        setShowForm(false);
    }, [newName, groupId, newTrackingType]);

    const handleDelete = useCallback((id) => {
        deleteExercise(id);
        setExercises(getExercisesByGroup(groupId));
    }, [groupId]);

    if (!group) {
        return (
            <div className="page">
                <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <p className="empty-state-text">Muscle group not found</p>
                    <button className="btn btn-primary" onClick={() => navigate('/muscle-groups')}>
                        Back to Groups
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page group-detail-page">
            <div className="back-link" onClick={() => navigate('/muscle-groups')}>
                ← Muscle Groups
            </div>

            <div className="group-detail-header" style={{ '--group-color': group.color }}>
                <span className="group-detail-icon">{group.icon}</span>
                <div>
                    <h1 className="page-title" style={{ marginBottom: 0 }}>{group.name}</h1>
                    <p className="page-subtitle" style={{ marginTop: '4px', marginBottom: 0 }}>
                        {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            <div className="divider" />

            {/* Exercise List */}
            <div className="group-exercises">
                {exercises.map((ex, i) => {
                    const lastSession = getLastNSessions(ex.id, 1)[0];
                    const tc = getTrackingConfig(ex.trackingType || 'weight_reps');
                    return (
                        <div
                            key={ex.id}
                            className="glass-card clickable group-exercise-card"
                            style={{ animationDelay: `${i * 0.04}s` }}
                        >
                            <div
                                className="group-exercise-main"
                                onClick={() => navigate(`/exercise/${ex.id}/history`)}
                            >
                                <div className="group-exercise-info">
                                    <h3 className="group-exercise-name">{ex.name}</h3>
                                    {lastSession ? (
                                        <span className="group-exercise-last">
                                            Last: {tc.summary(lastSession.sets[0])}
                                        </span>
                                    ) : (
                                        <span className="group-exercise-last">No logs yet · {tc.label}</span>
                                    )}
                                </div>
                                <span className="exercise-card-arrow">›</span>
                            </div>
                            {ex.isCustom && (
                                <button
                                    className="group-exercise-delete"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(ex.id);
                                    }}
                                    title="Delete custom exercise"
                                >
                                    🗑
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add Custom Exercise */}
            {showForm ? (
                <div className="glass-card group-add-form">
                    <label className="input-label">Exercise Name</label>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Cable Crossover"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        autoFocus
                        id="custom-exercise-input"
                    />
                    <label className="input-label" style={{ marginTop: '12px' }}>Tracking Type</label>
                    <select
                        className="input-field"
                        value={newTrackingType}
                        onChange={(e) => setNewTrackingType(e.target.value)}
                        id="tracking-type-select"
                    >
                        {trackingOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <div className="group-add-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>
                            Cancel
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={handleAdd} id="save-custom-exercise">
                            Add Exercise
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    className="btn btn-primary btn-block"
                    onClick={() => setShowForm(true)}
                    id="add-custom-exercise-btn"
                    style={{ marginTop: 'var(--space-md)' }}
                >
                    + Add Custom Exercise
                </button>
            )}
        </div>
    );
}
