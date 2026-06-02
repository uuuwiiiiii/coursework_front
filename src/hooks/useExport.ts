// Функция для скачивания CSV
const downloadCSV = (data: any[], filename: string, headers: Record<string, string>) => {
    if (!data || data.length === 0) {
        alert("Нет данных для экспорта");
        return;
    }

    // Создаем строки CSV
    const rows = data.map(item => {
        const row: string[] = [];
        Object.keys(headers).forEach(key => {
            let value = item[key];
            if (typeof value === 'object' && value !== null) {
                // Для вложенных объектов (например, city.name)
                if (value.name !== undefined) {
                    value = value.name;
                } else if (value.fio !== undefined) {
                    value = value.fio;
                } else {
                    value = JSON.stringify(value);
                }
            }
            // Экранируем кавычки и спецсимволы
            if (typeof value === 'string') {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            row.push(value !== undefined && value !== null ? String(value) : "");
        });
        return row.join(",");
    });

    // Заголовки
    const headerRow = Object.values(headers).join(",");
    const csvContent = [headerRow, ...rows].join("\n");

    // Скачивание
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// Экспорт городов
export const exportCitiesToCSV = (cities: any[]) => {
    const headers = {
        name: "Название города",
        country: "Страна",
    };
    const data = cities.map(city => ({
        name: city.name,
        country: city.country,
    }));
    downloadCSV(data, "cities", headers);
};

// Экспорт команд
export const exportTeamsToCSV = (teams: any[]) => {
    const headers = {
        name: "Название команды",
        city: "Город",
        country: "Страна",
        peoplesInTeam: "Количество игроков",
        numOfWin: "Количество побед",
    };
    const data = teams.map(team => ({
        name: team.name,
        city: team.city?.name || "",
        country: team.city?.country || "",
        peoplesInTeam: team.peoplesInTeam,
        numOfWin: team.numOfWin,
    }));
    downloadCSV(data, "teams", headers);
};

// Экспорт судей
export const exportRefereesToCSV = (referees: any[]) => {
    const headers = {
        fio: "ФИО",
        license: "Лицензия",
        city: "Город",
        country: "Страна",
        stageYears: "Стаж (лет)",
    };
    const data = referees.map(referee => ({
        fio: referee.fio,
        license: referee.license,
        city: referee.city?.name || "",
        country: referee.city?.country || "",
        stageYears: referee.stageYears,
    }));
    downloadCSV(data, "referees", headers);
};

// Экспорт матчей
export const exportMatchesToCSV = (matches: any[]) => {
    const getStageName = (stageType: number) => {
        const stages: Record<number, string> = {
            1: "Групповой этап",
            2: "1/8 финала",
            3: "1/4 финала",
            4: "1/2 финала",
            5: "Финал",
            6: "Матч за 3 место",
        };
        return stages[stageType] || "Неизвестно";
    };

    const getStatusName = (phaseType: number) => {
        const statuses: Record<number, string> = {
            1: "Завершен",
            2: "Отменен",
            3: "Идет",
            4: "Запланирован",
        };
        return statuses[phaseType] || "Неизвестно";
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

    const headers = {
        teamHost: "Команда-хозяин",
        hostScore: "Очки хозяев",
        teamGuest: "Команда-гость",
        guestScore: "Очки гостей",
        referee: "Судья",
        city: "Город",
        country: "Страна",
        stage: "Стадия",
        status: "Статус",
        dateTime: "Дата и время",
    };

    const data = matches.map(match => ({
        teamHost: match.teamHost?.name || "",
        hostScore: match.hostCount,
        teamGuest: match.teamGuest?.name || "",
        guestScore: match.guestCount,
        referee: match.referee?.fio || "",
        city: match.city?.name || "",
        country: match.city?.country || "",
        stage: getStageName(match.stageType),
        status: getStatusName(match.phaseType),
        dateTime: formatDateTime(match.dateTime),
    }));
    downloadCSV(data, "matches", headers);
};
