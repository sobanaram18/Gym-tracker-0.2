import { useNavigate } from 'react-router-dom';
import {
    getStreak,
    getTodaySchedule,
    getExerciseById,
    getMuscleGroupById,
    getLogsByDate,
    getTodayISO,
} from '../db/storage';
import './Home.css';

export default function Home() {
    const navigate = useNavigate();
    const streak = getStreak();
    const todayExerciseIds = getTodaySchedule();
    const todayISO = getTodayISO();
    const todayLogs = getLogsByDate(todayISO);

    const exercises = todayExerciseIds.map(id => getExerciseById(id)).filter(Boolean);
    const muscleGroupNames = [...new Set(
        exercises.map(e => getMuscleGroupById(e.muscleGroupId)?.name).filter(Boolean)
    )];

    const loggedExerciseIds = new Set(todayLogs.map(l => l.exerciseId));
    const completedCount = exercises.filter(e => loggedExerciseIds.has(e.id)).length;

    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    const greetingHour = today.getHours();
    let greeting = 'Good morning';
    if (greetingHour >= 12 && greetingHour < 17) greeting = 'Good afternoon';
    else if (greetingHour >= 17) greeting = 'Good evening';

    return (
        <div className="page home-page">
            {/* Header */}
            <div className="home-header">
                <div className="home-greeting">
                    <span className="home-greeting-text">{greeting} 👋</span>
                    <h1 className="home-date">{dayName}, {dateStr}</h1>
                </div>
            </div>

            {/* Streak Banner */}
            <div className="streak-banner" id="streak-banner">
                <div className="streak-flame">🔥</div>
                <div className="streak-info">
                    <span className="streak-count">{streak}</span>
                    <span className="streak-label">day streak</span>
                </div>
                <div className="streak-glow" />
            </div>

            {/* Today's Workout Card */}
            <div
                className="glass-card clickable today-card"
                onClick={() => navigate('/today')}
                id="today-workout-card"
            >
                <div className="today-card-header">
                    <span className="today-card-emoji">🏋️</span>
                    <h2 className="today-card-title">Today's Workout</h2>
                </div>
                {exercises.length > 0 ? (
                    <>
                        <div className="today-card-stats">
                            <div className="today-stat">
                                <span className="today-stat-value">{exercises.length}</span>
                                <span className="today-stat-label">exercises</span>
                            </div>
                            <div className="today-stat-divider" />
                            <div className="today-stat">
                                <span className="today-stat-value">{completedCount}</span>
                                <span className="today-stat-label">completed</span>
                            </div>
                            <div className="today-stat-divider" />
                            <div className="today-stat">
                                <span className="today-stat-value">{muscleGroupNames.length}</span>
                                <span className="today-stat-label">groups</span>
                            </div>
                        </div>
                        <div className="today-card-groups">
                            {muscleGroupNames.map(name => (
                                <span key={name} className="badge badge-purple">{name}</span>
                            ))}
                        </div>
                        {/* Progress bar */}
                        <div className="today-progress">
                            <div className="today-progress-bar">
                                <div
                                    className="today-progress-fill"
                                    style={{ width: `${exercises.length > 0 ? (completedCount / exercises.length) * 100 : 0}%` }}
                                />
                            </div>
                            <span className="today-progress-text">
                                {completedCount}/{exercises.length} done
                            </span>
                        </div>
                    </>
                ) : (
                    <p className="today-card-empty">
                        No exercises scheduled for today. Set up your schedule to get started!
                    </p>
                )}
                <div className="today-card-cta">
                    <span>Start workout →</span>
                </div>
            </div>

            {/* Quick Links */}
            <div className="home-links">
                <div
                    className="glass-card clickable home-link-card"
                    onClick={() => navigate('/muscle-groups')}
                    id="muscle-groups-link"
                >
                    <span className="home-link-icon">💪</span>
                    <span className="home-link-text">Muscle Groups</span>
                    <span className="home-link-arrow">→</span>
                </div>
                <div
                    className="glass-card clickable home-link-card"
                    onClick={() => navigate('/schedule')}
                    id="schedule-link"
                >
                    <span className="home-link-icon">📅</span>
                    <span className="home-link-text">Schedule</span>
                    <span className="home-link-arrow">→</span>
                </div>
            </div>
        </div>
    );
}
