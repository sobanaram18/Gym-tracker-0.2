import { useNavigate } from 'react-router-dom';
import { getMuscleGroups, getExercisesByGroup } from '../db/storage';
import './MuscleGroups.css';

export default function MuscleGroups() {
    const navigate = useNavigate();
    const groups = getMuscleGroups();

    return (
        <div className="page">
            <h1 className="page-title">Muscle Groups</h1>
            <p className="page-subtitle">Browse exercises by muscle group</p>

            <div className="muscle-grid">
                {groups.map((group, i) => {
                    const exerciseCount = getExercisesByGroup(group.id).length;
                    return (
                        <div
                            key={group.id}
                            className="glass-card clickable muscle-card"
                            onClick={() => navigate(`/muscle-groups/${group.id}`)}
                            id={`muscle-group-${group.name.toLowerCase()}`}
                            style={{
                                '--group-color': group.color,
                                animationDelay: `${i * 0.06}s`,
                            }}
                        >
                            <div className="muscle-card-glow" style={{ background: group.color }} />
                            <div className="muscle-card-icon">{group.icon}</div>
                            <h3 className="muscle-card-name">{group.name}</h3>
                            <span className="muscle-card-count">
                                {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                            </span>
                            <div
                                className="muscle-card-bar"
                                style={{ background: group.color }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
