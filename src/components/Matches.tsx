import {type FC, useEffect, useState} from "react";
import {exportMatchesToCSV} from "../hooks/useExport";
import type {City, Match, Referee, Team} from "../types";
import {
    Badge,
    Button,
    Card,
    CardSection,
    Divider,
    Grid,
    Group,
    Modal,
    NumberInput,
    Select,
    Stack,
    Text,
    TextInput,
} from "@mantine/core";
import {DateTimePicker} from "@mantine/dates";
import {useForm} from "@mantine/form";
import {useMatchesQuery, useMatchMutation} from "../hooks/useMatches";
import {useTeamsQuery} from "../hooks/useTeams";
import {useRefereesQuery} from "../hooks/useReferees";
import {useCitiesQuery} from "../hooks/useCities";
import {useAuth} from "../context/AuthContext";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import dayjs from "dayjs";

const Matches = () => {
    const {data: matches} = useMatchesQuery();
    const [modalOpened, setModalOpened] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);

    const [editingMatch, setEditingMatch] = useState<Match | null>(null);

    const {isAuthenticated, isAdmin} = useAuth();

    useEffect(() => {
        if (matches) {
            if (selectedDate) {
                const filtered = matches.filter((match) => {
                    const matchDate = dayjs(match.dateTime).format("YYYY-MM-DD");
                    const filterDate = dayjs(selectedDate).format("YYYY-MM-DD");
                    return matchDate === filterDate;
                });
                setFilteredMatches(filtered);
            } else {
                setFilteredMatches(matches);
            }
        }
    }, [matches, selectedDate]);

    const displayMatches = selectedDate ? filteredMatches : matches || [];

    return (
        <div>
            <Group justify="space-between" align="center" wrap="wrap">
                <h1>Матчи</h1>
                <Group>
                    <DateTimePicker
                        placeholder="Выберите дату"
                        value={selectedDate}
                        onChange={setSelectedDate}
                        clearable
                        size="sm"
                        style={{width: 250}}
                    />
                    {isAuthenticated && (
                        <Button variant="outline" onClick={() => exportMatchesToCSV(displayMatches)}>
                            Сохранить CSV
                        </Button>
                    )}
                    {isAdmin && (
                        <Button onClick={() => setModalOpened(true)}>Добавить</Button>
                    )}
                </Group>
            </Group>

            {selectedDate && (
                <Text size="sm" c="dimmed" mt="xs">
                    Показаны матчи за {dayjs(selectedDate).format("DD.MM.YYYY")}
                    <Button variant="subtle" size="compact-sm" onClick={() => setSelectedDate(null)} ml="md">
                        Сбросить фильтр
                    </Button>
                </Text>
            )}

            <Stack gap="md" mt="xl">
                {displayMatches.length === 0 ? (
                    <Text ta="center" c="dimmed" py="xl">
                        {selectedDate ? "Нет матчей за выбранную дату" : "Нет матчей"}
                    </Text>
                ) : (
                    displayMatches.map((match) => (
                        <MatchCard
                            key={match.id}
                            match={match}
                            isAdmin={isAdmin}
                            onEdit={setEditingMatch} // ✅ Передаем функцию открытия
                        />
                    ))
                )}
            </Stack>

            {isAdmin && (
                <MatchForm opened={modalOpened} onClose={() => setModalOpened(false)}/>
            )}

            <MatchEditForm
                opened={!!editingMatch}
                onClose={() => setEditingMatch(null)}
                match={editingMatch}
            />
        </div>
    );
};

type MatchFormProps = {
    opened: boolean;
    onClose: () => void;
};

const MatchForm: FC<MatchFormProps> = ({opened, onClose}) => {
    const {addMatch, isAdding} = useMatchMutation();
    const {data: teams} = useTeamsQuery();
    const {data: referees} = useRefereesQuery();
    const {data: cities} = useCitiesQuery();

    const form = useForm({
        initialValues: {
            teamGuestId: null as number | null,
            teamHostId: null as number | null,
            refereeId: null as number | null,
            cityId: null as number | null,
            stageType: 1,
            phaseType: 4,
            guestCount: 0,
            hostCount: 0,
            dateTime: "",
        },
        validate: {
            teamGuestId: (value) => (!value ? "Выберите гостевую команду" : null),
            teamHostId: (value) => (!value ? "Выберите домашнюю команду" : null),
            refereeId: (value) => (!value ? "Выберите судью" : null),
            cityId: (value) => (!value ? "Выберите город" : null),
            guestCount: (value) => (value !== null && value < 0 ? "Не может быть отрицательным" : null),
            hostCount: (value) => (value !== null && value < 0 ? "Не может быть отрицательным" : null),
            dateTime: (value) => (!value ? "Выберите дату и время" : null),
        },
    });

    const handleSubmit = async (values: typeof form.values) => {
        if (values.teamGuestId === values.teamHostId) {
            alert("❌ Ошибка: Команда-хозяин и команда-гость должны быть разными!");
            return;
        }

        const selectedTeamGuest = teams?.find((team) => team.id === Number(values.teamGuestId));
        const selectedTeamHost = teams?.find((team) => team.id === Number(values.teamHostId));
        const selectedReferee = referees?.find((referee) => referee.id === Number(values.refereeId));
        const selectedCity = cities?.find((city) => city.id === Number(values.cityId));

        if (!selectedTeamGuest || !selectedTeamHost || !selectedReferee || !selectedCity) {
            alert("❌ Убедитесь, что выбраны все поля");
            return;
        }

        if (selectedReferee.city?.id === selectedTeamHost.city?.id) {
            alert(`❌ Судья ${selectedReferee.fio} проживает в городе команды-хозяина!`);
            return;
        }

        if (selectedReferee.city?.id === selectedTeamGuest.city?.id) {
            alert(`❌ Судья ${selectedReferee.fio} проживает в городе команды-гостя!`);
            return;
        }

        if (selectedReferee.city?.id === selectedCity?.id) {
            alert(`❌ Судья ${selectedReferee.fio} проживает в этом городе ${selectedReferee.city?.name}!`);
            return;
        }

        let formattedDateTime = values.dateTime;
        if (formattedDateTime && !formattedDateTime.includes("T")) {
            formattedDateTime = formattedDateTime.replace(" ", "T");
        }

        const matchData = {
            teamGuest: {id: selectedTeamGuest.id},
            teamHost: {id: selectedTeamHost.id},
            referee: {id: selectedReferee.id},
            city: {id: selectedCity.id},
            stageType: values.stageType,
            phaseType: values.phaseType,
            guestCount: values.guestCount,
            hostCount: values.hostCount,
            dateTime: formattedDateTime,
        };

        await addMatch(matchData);
        form.reset();
        onClose();
    };

    const teamOptions = teams?.map((team: Team) => ({
        value: team.id.toString(),
        label: `${team.name} (${team.city?.name})`
    })) || [];
    const refereeOptions = referees?.map((referee: Referee) => ({
        value: referee.id.toString(),
        label: `${referee.fio} (${referee.city?.name})`
    })) || [];
    const cityOptions = cities?.map((city: City) => ({
        value: city.id.toString(),
        label: `${city.name} (${city.country})`
    })) || [];

    const stageOptions = [
        {value: 1, label: "Групповой этап"}, {value: 2, label: "1/8 финала"}, {value: 3, label: "1/4 финала"},
        {value: 4, label: "1/2 финала"}, {value: 5, label: "Финал"}, {value: 6, label: "Матч за 3 место"},
    ];
    const phaseOptions = [
        {value: 1, label: "Закончен"}, {value: 2, label: "Отменен"}, {value: 3, label: "Идет"}, {
            value: 4,
            label: "Запланирован"
        },
    ];

    return (
        <Modal opened={opened} onClose={onClose} title="Добавить новый матч" size="xl" centered>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <Grid>
                        <Grid.Col span={6}><Select label="Гостевая команда" placeholder="Выберите команду"
                                                   data={teamOptions} {...form.getInputProps("teamGuestId")} required/></Grid.Col>
                        <Grid.Col span={6}><Select label="Домашняя команда" placeholder="Выберите команду"
                                                   data={teamOptions} {...form.getInputProps("teamHostId")}
                                                   required/></Grid.Col>
                    </Grid>
                    <Grid>
                        <Grid.Col span={6}><Select label="Судья" placeholder="Выберите судью"
                                                   data={refereeOptions} {...form.getInputProps("refereeId")} required/></Grid.Col>
                        <Grid.Col span={6}><Select label="Город" placeholder="Выберите город"
                                                   data={cityOptions} {...form.getInputProps("cityId")}
                                                   required/></Grid.Col>
                    </Grid>
                    <Grid>
                        <Grid.Col span={6}><Select label="Стадия турнира"
                                                   data={stageOptions} {...form.getInputProps("stageType")}
                                                   required/></Grid.Col>
                        <Grid.Col span={6}><Select label="Статус"
                                                   data={phaseOptions} {...form.getInputProps("phaseType")}
                                                   required/></Grid.Col>
                    </Grid>
                    <Grid>
                        <Grid.Col span={6}><NumberInput label="Очки гостей"
                                                        min={0} {...form.getInputProps("guestCount")}
                                                        required/></Grid.Col>
                        <Grid.Col span={6}><NumberInput label="Очки хозяев" min={0} {...form.getInputProps("hostCount")}
                                                        required/></Grid.Col>
                    </Grid>
                    <TextInput label="Дата и время" type="datetime-local" {...form.getInputProps("dateTime")} required/>
                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={onClose}>Отмена</Button>
                        <Button type="submit" loading={isAdding}>Добавить матч</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

type MatchEditFormProps = {
    opened: boolean;
    onClose: () => void;
    match: Match | null;
};

const MatchEditForm: FC<MatchEditFormProps> = ({opened, onClose, match}) => {
    const {updateMatch, isUpdating} = useMatchMutation();
    const {data: teams} = useTeamsQuery();
    const {data: referees} = useRefereesQuery();
    const {data: cities} = useCitiesQuery();

    const form = useForm({
        initialValues: {
            teamGuestId: null as number | null,
            teamHostId: null as number | null,
            refereeId: null as number | null,
            cityId: null as number | null,
            stageType: 1,
            phaseType: 4,
            guestCount: 0,
            hostCount: 0,
            dateTime: "",
        },
        validate: {
            teamGuestId: (value) => (!value ? "Выберите гостевую команду" : null),
            teamHostId: (value) => (!value ? "Выберите домашнюю команду" : null),
            refereeId: (value) => (!value ? "Выберите судью" : null),
            cityId: (value) => (!value ? "Выберите город" : null),
            guestCount: (value) => (value !== null && value < 0 ? "Не может быть отрицательным" : null),
            hostCount: (value) => (value !== null && value < 0 ? "Не может быть отрицательным" : null),
            dateTime: (value) => (!value ? "Выберите дату и время" : null),
        },
    });

    useEffect(() => {
        if (match && opened) {
            const safeDateTime = match.dateTime ? match.dateTime.substring(0, 16) : "";
            form.setValues({
                teamGuestId: match.teamGuest?.id || null,
                teamHostId: match.teamHost?.id || null,
                refereeId: match.referee?.id || null, // ✅ Исправлено (было "match .referee?.i d")
                cityId: match.city?.id || null,
                stageType: match.stageType || 1,
                phaseType: match.phaseType || 4,
                guestCount: match.guestCount || 0, // ✅ Исправлено (было "match.gues tCount")
                hostCount: match.hostCount || 0,
                dateTime: safeDateTime,
            });
        }
    }, [match, opened]);

    const teamOptions = teams?.map((team: Team) => ({
        value: team.id.toString(),
        label: `${team.name} (${team.city?.name})`
    })) || [];
    const refereeOptions = referees?.map((referee: Referee) => ({
        value: referee.id.toString(),
        label: `${referee.fio} (${referee.city?.name})`
    })) || [];
    const cityOptions = cities?.map((city: City) => ({
        value: city.id.toString(),
        label: `${city.name} (${city.country})`
    })) || [];

    const stageOptions = [
        {value: 1, label: "Групповой этап"}, {value: 2, label: "1/8 финала"}, {value: 3, label: "1/4 финала"},
        {value: 4, label: "1/2 финала"}, {value: 5, label: "Финал"}, {value: 6, label: "Матч за 3 место"},
    ];
    const phaseOptions = [
        {value: 1, label: "Закончен"}, {value: 2, label: "Отменен"}, {value: 3, label: "Идет"}, {
            value: 4,
            label: "Запланирован"
        },
    ];

    const handleSubmit = async (values: typeof form.values) => {
        if (!match) return;

        if (values.teamGuestId === values.teamHostId) {
            alert("❌ Ошибка: Команды должны быть разными!");
            return;
        }

        const selectedTeamGuest = teams?.find((team) => team.id === Number(values.teamGuestId));
        const selectedTeamHost = teams?.find((team) => team.id === Number(values.teamHostId));
        const selectedReferee = referees?.find((referee) => referee.id === Number(values.refereeId));
        const selectedCity = cities?.find((city) => city.id === Number(values.cityId));

        if (!selectedTeamGuest || !selectedTeamHost || !selectedReferee || !selectedCity) {
            alert("❌ Убедитесь, что выбраны все поля");
            return;
        }

        if (selectedReferee.city?.id === selectedTeamHost.city?.id || selectedReferee.city?.id === selectedTeamGuest.city?.id) {
            alert("❌ Судья не может быть из города одной из команд!");
            return;
        }

        if (selectedReferee.city?.id === selectedCity?.id) {
            alert(`❌ Судья ${selectedReferee.fio} проживает в этом городе ${selectedReferee.city?.name}!`);
            return;
        }

        const matchData = {
            id: match.id,
            teamGuest: {id: selectedTeamGuest.id},
            teamHost: {id: selectedTeamHost.id},
            referee: {id: selectedReferee.id}, // ✅ Исправлено
            city: {id: selectedCity.id},
            stageType: values.stageType,
            phaseType: values.phaseType,
            guestCount: values.guestCount, // ✅ Исправлено
            hostCount: values.hostCount,
            dateTime: values.dateTime,
        };

        updateMatch(matchData);
        form.reset();
        onClose();
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Редактировать матч" size="xl" centered>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <Grid>
                        <Grid.Col span={6}><Select label="Гостевая команда" placeholder="Выберите команду"
                                                   data={teamOptions} {...form.getInputProps("teamGuestId")} required/></Grid.Col>
                        <Grid.Col span={6}><Select label="Домашняя команда" placeholder="Выберите команду"
                                                   data={teamOptions} {...form.getInputProps("teamHostId")}
                                                   required/></Grid.Col>
                    </Grid>
                    <Grid>
                        <Grid.Col span={6}><Select label="Судья" placeholder="Выберите судью"
                                                   data={refereeOptions} {...form.getInputProps("refereeId")} required/></Grid.Col>
                        <Grid.Col span={6}><Select label="Город" placeholder="Выберите город"
                                                   data={cityOptions} {...form.getInputProps("cityId")}
                                                   required/></Grid.Col>
                    </Grid>
                    <Grid>
                        <Grid.Col span={6}><Select label="Стадия турнира"
                                                   data={stageOptions} {...form.getInputProps("stageType")}
                                                   required/></Grid.Col>
                        <Grid.Col span={6}><Select label="Статус"
                                                   data={phaseOptions} {...form.getInputProps("phaseType")}
                                                   required/></Grid.Col>
                    </Grid>
                    <Grid>
                        <Grid.Col span={6}><NumberInput label="Очки гостей"
                                                        min={0} {...form.getInputProps("guestCount")}
                                                        required/></Grid.Col>
                        <Grid.Col span={6}><NumberInput label="Очки хозяев" min={0} {...form.getInputProps("hostCount")}
                                                        required/></Grid.Col>
                    </Grid>
                    <TextInput label="Дата и время" type="datetime-local" {...form.getInputProps("dateTime")} required/>
                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={onClose}>Отмена</Button>
                        <Button type="submit" loading={isUpdating}>Сохранить изменения</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

type MatchCardProps = {
    match: Match;
    isAdmin: boolean;
    onEdit: (match: Match) => void; // ✅ Новый пропс
};

const MatchCard: FC<MatchCardProps> = ({match, isAdmin, onEdit}) => {
    const {deleteMatch, isDeleting} = useMatchMutation();

    const handleDelete = () => {
        if (window.confirm(`Удалить матч ${match.teamGuest.name} vs ${match.teamHost.name}?`)) {
            deleteMatch(match.id);
        }
    };

    const formatDateTime = (dateTime: string) => {
        const date = new Date(dateTime);
        return date.toLocaleString("ru-RU", {
            day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
        });
    };

    const getStageName = (stageType: number) => {
        const stages: Record<number, string> = {
            1: "Групповой этап",
            2: "1/8 финала",
            3: "1/4 финала",
            4: "1/2 финала",
            5: "Финал",
            6: "Матч за 3 место"
        };
        return stages[stageType] || "Неизвестно";
    };

    const getStatusName = (phaseType: number) => {
        const statuses: Record<number, string> = {1: "Завершен", 2: "Отменен", 3: "Идет", 4: "Запланирован"};
        return statuses[phaseType] || "Неизвестно";
    };

    const getStatusColor = (phaseType: number): string => {
        const colors: Record<number, string> = {1: "green", 2: "red", 3: "blue", 4: "yellow"};
        return colors[phaseType] || "gray";
    };

    return (
        <Card withBorder padding="lg" radius="md">
            <CardSection inheritPadding py="xs">
                <Group justify="space-between">
                    <Text fw={500} size="lg">{match.teamGuest.name} vs {match.teamHost.name}</Text>
                    <Badge color={getStatusColor(match.phaseType)}
                           variant="light">{getStatusName(match.phaseType)}</Badge>
                </Group>
            </CardSection>
            <CardSection inheritPadding py="xs">
                <Stack gap="xs">
                    <Group justify="center" gap="xl">
                        <Text size="xl" fw={700}>{match.guestCount}</Text>
                        <Text size="xl" fw={700}>:</Text>
                        <Text size="xl" fw={700}>{match.hostCount}</Text>
                    </Group>
                    <Divider/>
                    <Text size="sm"><strong>Судья:</strong> {match.referee.fio}</Text>
                    <Text size="sm"><strong>Город:</strong> {match.city.name} ({match.city.country})</Text>
                    <Text size="sm"><strong>Стадия:</strong> {getStageName(match.stageType)}</Text>
                    <Text size="sm"><strong>Дата и время:</strong> {formatDateTime(match.dateTime)}</Text>
                </Stack>
            </CardSection>
            {isAdmin && (
                <Group justify="flex-end" mt="md">
                    <Button variant="light" onClick={() => onEdit(match)}>Редактировать</Button>
                    <Button onClick={handleDelete} loading={isDeleting}>Удалить</Button>
                </Group>
            )}
        </Card>
    );
};

export default Matches;