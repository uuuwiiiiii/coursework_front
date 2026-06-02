import { type FC, useState } from "react";
import type { Match } from "../types";

interface BracketProps {
    matches: Match[];
}

const BracketComponent: FC<BracketProps> = ({ matches }) => {
    const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; match: Match | null }>({
        visible: false,
        x: 0,
        y: 0,
        match: null,
    });

    // Группируем матчи по стадиям
    const quarterFinals = matches.filter(m => m.stageType === 3);
    const semiFinals = matches.filter(m => m.stageType === 4);
    const finalMatch = matches.find(m => m.stageType === 5);
    const thirdPlaceMatch = matches.find(m => m.stageType === 6);

    const getWinner = (match: Match) => {
        if (match.guestCount > match.hostCount) return match.teamGuest;
        if (match.hostCount > match.guestCount) return match.teamHost;
        return null;
    };

    const formatDateTime = (dateTime: string) => {
        const date = new Date(dateTime);
        return date.toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusName = (phaseType: number) => {
        const statuses: Record<number, string> = {
            1: "Закончен",
            2: "Отменен",
            3: "Идет",
            4: "Запланирован",
        };
        return statuses[phaseType] || "Неизвестно";
    };

    const getStatusColor = (phaseType: number) => {
        const colors: Record<number, string> = {
            1: "#2e7d32",
            2: "#c62828",
            3: "#1565c0",
            4: "#f57c00",
        };
        return colors[phaseType] || "#666";
    };

    const getStageName = (stageType: number) => {
        const stages: Record<number, string> = {
            3: "1/4 финала",
            4: "1/2 финала",
            5: "Финал",
            6: "Матч за 3 место",
        };
        return stages[stageType] || "Неизвестно";
    };

    const handleMouseEnter = (e: React.MouseEvent, match: Match) => {
        setTooltip({
            visible: true,
            x: e.clientX + 15,
            y: e.clientY - 50,
            match,
        });
    };

    const handleMouseLeave = () => {
        setTooltip({ visible: false, x: 0, y: 0, match: null });
    };

    const getMatchCard = (match: Match, isFinal: boolean = false) => {
        const winner = getWinner(match);
        return (
            <div
                className={`match-card ${isFinal ? 'final-card' : ''}`}
                onMouseEnter={(e) => handleMouseEnter(e, match)}
                onMouseLeave={handleMouseLeave}
            >
                <div className={`match-team ${winner === match.teamHost ? 'winner' : 'loser'}`}>
                    <span className="team-name">{match.teamHost.name}</span>
                    <span className={`team-score ${winner === match.teamHost ? 'winner-score' : 'loser-score'}`}>
                        {match.hostCount}
                    </span>
                </div>
                <div className={`match-team ${winner === match.teamGuest ? 'winner' : 'loser'}`}>
                    <span className="team-name">{match.teamGuest.name}</span>
                    <span className={`team-score ${winner === match.teamGuest ? 'winner-score' : 'loser-score'}`}>
                        {match.guestCount}
                    </span>
                </div>
            </div>
        );
    };

    if (matches.filter(m => m.stageType >= 3).length === 0) {
        return (
            <div className="empty-bracket">
                <h3>🏆 Нет матчей для отображения в турнирной сетке</h3>
                <p>Добавьте матчи плей-офф</p>
            </div>
        );
    }

    return (
        <div className="bracket-wrapper">
            {/* 1/4 финала */}
            {quarterFinals.length > 0 && (
                <div className="bracket-column">
                    <div className="bracket-title">1/4 финала</div>
                    <div className="bracket-matches quarter-finals">
                        {quarterFinals.map((match) => (
                            <div key={match.id} className="bracket-match">
                                {getMatchCard(match)}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 1/2 финала */}
            {semiFinals.length > 0 && (
                <div className="bracket-column">
                    <div className="bracket-title">1/2 финала</div>
                    <div className="bracket-matches semi-finals">
                        {semiFinals.map((match) => (
                            <div key={match.id} className="bracket-match semi-match">
                                {getMatchCard(match)}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Финал */}
            {finalMatch && (
                <div className="bracket-column">
                    <div className="bracket-title">Финал</div>
                    <div className="bracket-matches final-match-container">
                        <div className="bracket-match final-match">
                            {getMatchCard(finalMatch, true)}
                        </div>
                    </div>
                </div>
            )}

            {/* Матч за 3 место */}
            {thirdPlaceMatch && (
                <div className="bracket-column third-place">
                    <div className="bracket-title">Матч за 3 место</div>
                    <div className="bracket-matches third-place-container">
                        <div className="bracket-match">
                            {getMatchCard(thirdPlaceMatch)}
                        </div>
                    </div>
                </div>
            )}

            {/* Всплывающая подсказка */}
            {tooltip.visible && tooltip.match && (
                <div
                    className="match-tooltip"
                    style={{
                        position: "fixed",
                        left: tooltip.x,
                        top: tooltip.y,
                        zIndex: 1000,
                    }}
                >
                    <div className="tooltip-header">
                        <span className="tooltip-stage">{getStageName(tooltip.match.stageType)}</span>
                        <span className="tooltip-status" style={{ background: getStatusColor(tooltip.match.phaseType) }}>
                            {getStatusName(tooltip.match.phaseType)}
                        </span>
                    </div>
                    <div className="tooltip-content">
                        <div className="tooltip-row">
                            <span className="tooltip-label">Хозяева:</span>
                            <span className="tooltip-value">{tooltip.match.teamHost.name}</span>
                            <span className={`tooltip-score ${getWinner(tooltip.match) === tooltip.match.teamHost ? 'tooltip-winner' : 'tooltip-loser'}`}>
                                {tooltip.match.hostCount}
                            </span>
                        </div>
                        <div className="tooltip-row">
                            <span className="tooltip-label">Гости:</span>
                            <span className="tooltip-value">{tooltip.match.teamGuest.name}</span>
                            <span className={`tooltip-score ${getWinner(tooltip.match) === tooltip.match.teamGuest ? 'tooltip-winner' : 'tooltip-loser'}`}>
                                {tooltip.match.guestCount}
                            </span>
                        </div>
                        {tooltip.match.referee && (
                            <div className="tooltip-row">
                                <span className="tooltip-label">Судья:</span>
                                <span className="tooltip-value">{tooltip.match.referee.fio}</span>
                            </div>
                        )}
                        {tooltip.match.city && (
                            <div className="tooltip-row">
                                <span className="tooltip-label">Город:</span>
                                <span className="tooltip-value">{tooltip.match.city.name}, {tooltip.match.city.country}</span>
                            </div>
                        )}
                        <div className="tooltip-row">
                            <span className="tooltip-label">Дата:</span>
                            <span className="tooltip-value">{formatDateTime(tooltip.match.dateTime)}</span>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .bracket-wrapper {
                    display: flex;
                    flex-direction: row;
                    justify-content: center;
                    align-items: stretch;
                    gap: 50px;
                    overflow-x: auto;
                    padding: 30px;
                    background: #f0f4f8;
                    border-radius: 16px;
                    min-height: 550px;
                }

                .bracket-column {
                    flex-shrink: 0;
                    width: 260px;
                    display: flex;
                    flex-direction: column;
                }

                .bracket-title {
                    text-align: center;
                    font-weight: 700;
                    font-size: 14px;
                    margin-bottom: 25px;
                    color: #1e3c72;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }

                .bracket-matches {
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                }

                .quarter-finals {
                    gap: 20px;
                    justify-content: space-evenly;
                }

                .semi-finals {
                    gap: 50px;
                    justify-content: center;
                    padding: 30px 0;
                }

                .final-match-container {
                    justify-content: center;
                    padding: 80px 0;
                }

                .third-place-container {
                    justify-content: center;
                    padding: 80px 0;
                }

                .bracket-match {
                    transition: all 0.3s ease;
                }

                .match-card {
                    background: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    border: 1px solid #dce4ec;
                    transition: transform 0.2s, box-shadow 0.2s;
                    cursor: pointer;
                }

                .match-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
                }

                .final-card {
                    border: 2px solid #1e3c72;
                    box-shadow: 0 4px 12px rgba(30, 60, 114, 0.2);
                }

                .match-team {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 12px;
                    background: #ffffff;
                    border-bottom: 1px solid #eef2f6;
                }

                .match-team:last-child {
                    border-bottom: none;
                }

                .match-team.winner {
                    background: #e8f5e9;
                    border-left: 3px solid #2e7d32;
                }

                .match-team.loser {
                    background: #ffebee;
                    border-left: 3px solid #c62828;
                }

                .team-name {
                    font-size: 13px;
                    font-weight: 500;
                    color: #2c3e50;
                }

                .winner-score {
                    font-weight: 700;
                    font-size: 14px;
                    color: #2e7d32;
                }

                .loser-score {
                    font-weight: 600;
                    font-size: 14px;
                    color: #c62828;
                }

                .third-place {
                    border-left: 2px dashed #b0c4de;
                    padding-left: 40px;
                    margin-left: 20px;
                }

                /* Всплывающая подсказка */
                .match-tooltip {
                    background: #ffffff;
                    border-radius: 12px;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                    min-width: 280px;
                    max-width: 320px;
                    overflow: hidden;
                    animation: fadeIn 0.15s ease-out;
                    border: 1px solid #dce4ec;
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(5px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .tooltip-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 12px;
                    background: #e3f2fd;
                    border-bottom: 1px solid #dce4ec;
                }

                .tooltip-stage {
                    font-weight: 700;
                    font-size: 13px;
                    color: #1e3c72;
                    text-transform: uppercase;
                }

                .tooltip-status {
                    font-size: 11px;
                    padding: 3px 8px;
                    border-radius: 20px;
                    color: white;
                    font-weight: 500;
                }

                .tooltip-content {
                    padding: 12px;
                }

                .tooltip-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                    font-size: 12px;
                }

                .tooltip-row:last-child {
                    margin-bottom: 0;
                }

                .tooltip-label {
                    width: 55px;
                    font-weight: 600;
                    color: #1e3c72;
                }

                .tooltip-value {
                    flex: 1;
                    color: #2c3e50;
                }

                .tooltip-score {
                    font-weight: 700;
                    padding: 2px 8px;
                    border-radius: 12px;
                }

                .tooltip-winner {
                    color: #2e7d32;
                    background: #e8f5e9;
                }

                .tooltip-loser {
                    color: #c62828;
                    background: #ffebee;
                }

                .empty-bracket {
                    text-align: center;
                    padding: 60px;
                    background: #f0f4f8;
                    border-radius: 16px;
                    color: #2c3e50;
                }

                @media (max-width: 1000px) {
                    .bracket-wrapper {
                        gap: 30px;
                    }
                    .bracket-column {
                        width: 230px;
                    }
                    .match-tooltip {
                        min-width: 250px;
                    }
                }

                @media (max-width: 800px) {
                    .bracket-wrapper {
                        flex-direction: column;
                        align-items: center;
                    }
                    .third-place {
                        border-left: none;
                        border-top: 2px dashed #b0c4de;
                        padding-left: 0;
                        padding-top: 20px;
                        margin-left: 0;
                        margin-top: 20px;
                    }
                }
            `}</style>
        </div>
    );
};

export default BracketComponent;
