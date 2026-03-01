import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import {
    getExerciseById,
    getMuscleGroupById,
    getLogsByExercise,
    addLog,
    deleteLog,
    formatDate,
} from '../db/storage';
import { getTrackingConfig } from '../db/seed';
import './ExerciseHistory.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function ExerciseHistory() {
    const { exerciseId } = useParams();
    const navigate = useNavigate();
    const exercise = getExerciseById(exerciseId);
    const group = exercise ? getMuscleGroupById(exercise.muscleGroupId) : null;
    const trackingType = exercise?.trackingType || 'weight_reps';
    const trackingConfig = getTrackingConfig(trackingType);

    const [refreshKey, setRefreshKey] = useState(0);
    const [showPastLogForm, setShowPastLogForm] = useState(false);

    // Re-read logs on refresh
    const logs = getLogsByExercise(exerciseId);

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

    // Prepare chart data (reversed so oldest first)
    const chronologicalLogs = [...logs].reverse();
    const chartLabels = chronologicalLogs.map(l => {
        const d = new Date(l.date + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const chartValues = chronologicalLogs.map(l => trackingConfig.chartValue(l.sets));

    const groupColor = group?.color || 'var(--accent-purple)';
    const resolvedColor = getComputedColor(groupColor);

    const chartData = {
        labels: chartLabels,
        datasets: [
            {
                label: trackingConfig.chartLabel,
                data: chartValues,
                borderColor: resolvedColor,
                backgroundColor: `${resolvedColor}20`,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: resolvedColor,
                pointBorderColor: resolvedColor,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(22, 22, 29, 0.95)',
                titleColor: '#f0f0f5',
                bodyColor: '#f0f0f5',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 12,
                titleFont: { family: 'Inter', size: 13, weight: '600' },
                bodyFont: { family: 'Inter', size: 12 },
                cornerRadius: 8,
            },
        },
        scales: {
            x: {
                ticks: {
                    color: 'rgba(240, 240, 245, 0.35)',
                    font: { family: 'Inter', size: 11 },
                    maxRotation: 45,
                },
                grid: { color: 'rgba(255,255,255,0.04)' },
            },
            y: {
                ticks: {
                    color: 'rgba(240, 240, 245, 0.35)',
                    font: { family: 'Inter', size: 11 },
                },
                grid: { color: 'rgba(255,255,255,0.04)' },
            },
        },
    };

    const bestChartVal = chartValues.length > 0 ? Math.max(...chartValues) : 0;

    const handleDeleteLog = useCallback((logId) => {
        deleteLog(logId);
        setRefreshKey(k => k + 1);
    }, []);

    return (
        <div className="page history-page" key={refreshKey}>
            <div className="back-link" onClick={() => navigate(-1)}>
                ← Back
            </div>

            <div className="history-header">
                <div>
                    <h1 className="page-title" style={{ marginBottom: 0 }}>{exercise.name}</h1>
                    <span
                        className="badge"
                        style={{
                            background: `${resolvedColor}22`,
                            color: resolvedColor,
                            marginTop: '8px',
                            display: 'inline-flex',
                        }}
                    >
                        {group?.name} · {logs.length} session{logs.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="history-header-actions">
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowPastLogForm(v => !v)}
                        id="log-past-session-btn"
                    >
                        📝 {showPastLogForm ? 'Cancel' : 'Log Past'}
                    </button>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/workout/${exerciseId}`)}
                        id="log-new-session-btn"
                    >
                        + Log Today
                    </button>
                </div>
            </div>

            {/* Past Session Log Form */}
            {showPastLogForm && (
                <PastLogForm
                    exerciseId={exerciseId}
                    trackingConfig={trackingConfig}
                    onSave={() => {
                        setRefreshKey(k => k + 1);
                        setShowPastLogForm(false);
                    }}
                    onCancel={() => setShowPastLogForm(false)}
                />
            )}

            {/* Chart */}
            {logs.length > 0 ? (
                <div className="glass-card history-chart-container">
                    <h3 className="history-chart-title">{trackingConfig.chartLabel} Over Time</h3>
                    <div className="history-chart" id="progress-chart">
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">📊</div>
                    <p className="empty-state-text">No data yet. Log your first session!</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate(`/workout/${exerciseId}`)}
                    >
                        Log Workout
                    </button>
                </div>
            )}

            {/* Stats */}
            {logs.length > 0 && (
                <div className="history-stats">
                    <div className="glass-card history-stat">
                        <span className="history-stat-label">Best</span>
                        <span className="history-stat-value">{bestChartVal}</span>
                    </div>
                    <div className="glass-card history-stat">
                        <span className="history-stat-label">Sessions</span>
                        <span className="history-stat-value">{logs.length}</span>
                    </div>
                    <div className="glass-card history-stat">
                        <span className="history-stat-label">Type</span>
                        <span className="history-stat-value history-stat-type">{trackingConfig.label}</span>
                    </div>
                </div>
            )}

            {/* Session Log Table */}
            {logs.length > 0 && (
                <div className="history-log-section">
                    <h2 className="section-title">All Sessions</h2>
                    <div className="history-logs">
                        {logs.map((log, i) => (
                            <div
                                key={log.id}
                                className="glass-card history-log-card"
                                style={{ animationDelay: `${i * 0.04}s` }}
                            >
                                <div className="history-log-top">
                                    <div className="history-log-date">{formatDate(log.date)}</div>
                                    <button
                                        className="btn-icon history-log-delete"
                                        onClick={() => handleDeleteLog(log.id)}
                                        title="Delete session"
                                    >
                                        🗑
                                    </button>
                                </div>
                                <div className="history-log-sets">
                                    {log.sets.map((set, j) => (
                                        <div key={j} className="history-log-set">
                                            <span className="history-log-set-num">Set {j + 1}</span>
                                            <span className="history-log-set-val">
                                                {trackingConfig.summary(set)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Past Log Form ── */
function PastLogForm({ exerciseId, trackingConfig, onSave, onCancel }) {
    const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
    const [saved, setSaved] = useState(false);

    // Build empty set from tracking fields
    const emptySet = {};
    trackingConfig.fields.forEach(f => { emptySet[f.key] = ''; });
    const [sets, setSets] = useState([{ ...emptySet }]);

    const handleAddSet = useCallback(() => {
        setSets(prev => [...prev, { ...emptySet }]);
    }, []);

    const handleRemoveSet = useCallback((index) => {
        setSets(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleChange = useCallback((index, field, value) => {
        setSets(prev => prev.map((s, i) =>
            i === index ? { ...s, [field]: value } : s
        ));
    }, []);

    const handleSave = useCallback(() => {
        if (!logDate) return;

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

        addLog(exerciseId, validSets, logDate);
        setSaved(true);
        setTimeout(() => {
            onSave();
        }, 600);
    }, [sets, logDate, exerciseId, trackingConfig, onSave]);

    return (
        <div className="glass-card past-log-form">
            <h3 className="past-log-title">📝 Log Past Session</h3>
            <p className="past-log-desc">
                Record workout data for a previous date
            </p>

            {/* Date Picker */}
            <div className="past-log-date-row">
                <label className="input-label" style={{ margin: 0 }}>Date</label>
                <input
                    type="date"
                    className="input-field past-log-date-input"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    id="past-log-date"
                />
            </div>

            {/* Sets */}
            <div className="past-log-sets">
                {sets.map((set, i) => (
                    <div key={i} className="past-log-set-row">
                        <span className="past-log-set-label">Set {i + 1}</span>
                        <div className="past-log-set-inputs">
                            {trackingConfig.fields.map((field, fi) => (
                                <div className="past-log-input-group" key={field.key}>
                                    {fi > 0 && <span className="past-log-sep">·</span>}
                                    <input
                                        type={field.type}
                                        className="input-field past-log-input"
                                        placeholder="0"
                                        value={set[field.key] || ''}
                                        onChange={(e) => handleChange(i, field.key, e.target.value)}
                                        min="0"
                                        step={field.step}
                                    />
                                    <span className="past-log-unit">{field.unit}</span>
                                </div>
                            ))}
                            {sets.length > 1 && (
                                <button className="btn-icon past-log-remove" onClick={() => handleRemoveSet(i)}>×</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <button className="btn btn-secondary btn-block past-log-add-set" onClick={handleAddSet}>
                + Add Set
            </button>

            <div className="past-log-actions">
                <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                <button
                    className={`btn btn-primary ${saved ? 'log-save--success' : ''}`}
                    onClick={handleSave}
                    id="save-past-log"
                >
                    {saved ? '✓ Saved!' : 'Save Session'}
                </button>
            </div>
        </div>
    );
}

// Resolve CSS variable to actual color
function getComputedColor(cssVar) {
    if (!cssVar.startsWith('var(')) return cssVar;
    const name = cssVar.replace('var(', '').replace(')', '');
    const colorMap = {
        '--color-chest': '#ff6b6b',
        '--color-back': '#45b7d1',
        '--color-shoulders': '#ffb347',
        '--color-arms': '#f78fb3',
        '--color-legs': '#4ecdc4',
        '--color-core': '#f7dc6f',
        '--color-cardio': '#7c6aff',
        '--accent-purple': '#7c6aff',
    };
    return colorMap[name] || '#7c6aff';
}
