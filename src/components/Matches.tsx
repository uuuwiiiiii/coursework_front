import {type FC, useState} from "react";
import {exportMatchesToCSV} from "../hooks/useExport";
import type {City, Match, MatchRestrictions, Referee, Team} from "../types";
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
import {useForm} from "@mantine/form";
import {useFilteredMatchesQuery, useMatchMutation} from "../hooks/useMatches";
import {useTeamsQuery} from "../hooks/useTeams";
import {useRefereesQuery} from "../hooks/useReferees";
import {useCitiesQuery} from "../hooks/useCities";
import {useAuth} from "../context/AuthContext";
import "@mantine/core/styles.css";
import {useMatchAvailability} from "../hooks/useMatchAvailability";

const Matches = () => {
    const [restrictions, setRestrictions] = useState<MatchRestrictions>({});
    const [modalOpened, setModalOpened] = useState(false);
    const [editingMatch, setEditingMatch] = useState<Match | null>(null);
    const {isAuthenticated, isAdmin} = useAuth();

    // Используем фильтрованный запрос
    const {data: matches} = useFilteredMatchesQuery(restrictions);
    const {data: teams} = useTeamsQuery();
    const {data: referees} = useRefereesQuery();

    const handleFilterChange = (key: keyof MatchRestrictions, value: string | null) => {
        setRestrictions(prev => ({
            ...prev,
            [key]: value ? (key === 'date' ? value : Number(value)) : null
        }));
    };

    const teamOptions = teams?.map((team: Team) => ({
        value: team.id.toString(),
        label: `${team.name} (${team.city?.name})`
    })) || [];

    const refereeOptions = referees?.map((referee: Referee) => ({
        value: referee.id.toString(),
        label: `${referee.fio} (${referee.city?.name})`
    })) || [];

    const displayMatches = matches || [];

    return (
        <div>
            <Group justify="space-between" align="center" wrap="wrap">
                <h1>Матчи</h1>
                <Group>
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

            <Card withBorder p="md" mt="md">
                <Group grow>
                    <Select
                        label="Команда"
                        placeholder="Все команды"
                        data={teamOptions}
                        value={restrictions.teamId?.toString() || null}
                        onChange={(val) => handleFilterChange('teamId', val)}
                        clearable
                    />
                    <Select
                        label="Судья"
                        placeholder="Все судьи"
                        data={refereeOptions}
                        value={restrictions.refereeId?.toString() || null}
                        onChange={(val) => handleFilterChange('refereeId', val)}
                        clearable
                    />
                    <TextInput
                        label="Дата"
                        type="date"
                        placeholder="Выберите дату"
                        value={restrictions.date || ""}
                        onChange={(e) => handleFilterChange('date', e.target.value || null)}
                    />
                    {(restrictions.teamId || restrictions.refereeId || restrictions.date) && (
                        <Button variant="subtle" onClick={() => setRestrictions({})} mt="auto">
                            Сбросить фильтры
                        </Button>
                    )}
                </Group>
            </Card>

            <Stack gap="md" mt="xl">
                {displayMatches.length === 0 ? (
                    <Text ta="center" c="dimmed" py="xl">Нет матчей</Text>
                ) : (
                    displayMatches.map((match) => (
                        <MatchCard
                            key={match.id}
                            match={match}
                            isAdmin={isAdmin}
                            onEdit={setEditingMatch}
                        />
                    ))
                )}
            </Stack>

            {isAdmin && (
                <MatchForm
                    opened={modalOpened}
                    onClose={() => setModalOpened(false)}
                    editingMatch={null}
                />
            )}

            <MatchForm
                opened={!!editingMatch}
                onClose={() => setEditingMatch(null)}
                editingMatch={editingMatch}
            />
        </div>
    );
};

type MatchFormProps = {
    opened: boolean;
    onClose: () => void;
    editingMatch: Match | null;
};

const MatchForm: FC<MatchFormProps> = ({opened, onClose, editingMatch}) => {
    const {addMatch, updateMatch, isAdding, isUpdating} = useMatchMutation();
    const {data: teams} = useTeamsQuery();
    const {data: referees} = useRefereesQuery();
    const {data: cities} = useCitiesQuery();
    const isEditing = !!editingMatch;
    const isSaving = isAdding || isUpdating;
    const {mutateAsync: checkAvailability, isPending: isChecking} = useMatchAvailability();
    const form = useForm({
        initialValues: {
            teamGuestId: editingMatch?.teamGuest?.id || null,
            teamHostId: editingMatch?.teamHost?.id || null,
            refereeId: editingMatch?.referee?.id || null,
            cityId: editingMatch?.city?.id || null,
            stageType: editingMatch?.stageType || 1,
            phaseType: editingMatch?.phaseType || 4,
            guestCount: editingMatch?.guestCount || 0,
            hostCount: editingMatch?.hostCount || 0,
            dateTime: editingMatch?.dateTime?.substring(0, 16) || "",
        },
        validate: {
            teamGuestId: (v) => !v ? "Выберите гостевую команду" : null,
            teamHostId: (v) => !v ? "Выберите домашнюю команду" : null,
            refereeId: (v) => !v ? "Выберите судью" : null,
            cityId: (v) => !v ? "Выберите город" : null,
            dateTime: (v) => !v ? "Выберите дату и время" : null,
        },
    });

    const handleSubmit = async (values: typeof form.values) => {
        if (values.teamGuestId === values.teamHostId) {
            alert("❌ Команды должны быть разными!");
            return;
        }

        const selectedTeamGuest = teams?.find(t => t.id === Number(values.teamGuestId));
        const selectedTeamHost = teams?.find(t => t.id === Number(values.teamHostId));
        const selectedReferee = referees?.find(r => r.id === Number(values.refereeId));
        const selectedCity = cities?.find(c => c.id === Number(values.cityId));

        if (!selectedTeamGuest || !selectedTeamHost || !selectedReferee || !selectedCity) {
            alert("❌ Заполните все поля");
            return;
        }

        if (selectedReferee.city?.id === selectedTeamHost.city?.id ||
            selectedReferee.city?.id === selectedTeamGuest.city?.id) {
            alert("❌ Судья не может быть из города одной из команд!");
            return;
        }

        if (selectedReferee.city?.id === selectedCity?.id) {
            alert("❌ Судья не может проживать в городе проведения матча!");
            return;
        }

        // Проверка доступности на дату
        try {
            const isAvailable = await checkAvailability({
                teamGuestId: Number(values.teamGuestId),
                teamHostId: Number(values.teamHostId),
                refereeId: Number(values.refereeId),
                dateTime: values.dateTime,
                excludeMatchId: isEditing && editingMatch ? editingMatch.id : undefined,
            });

            if (!isAvailable) {
                alert("❌ На выбранную дату команда или судья уже заняты!\n" +
                    "У команды или судьи уже есть матч в этот день.");
                return;
            }
        } catch (error) {
            console.error("Ошибка проверки доступности:", error);
            alert("Ошибка при проверке доступности");
            return;
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
            dateTime: values.dateTime,
        };

        if (isEditing && editingMatch) {
            updateMatch({id: editingMatch.id, ...matchData});
        } else {
            addMatch(matchData);
        }

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
        {value: 1, label: "Групповой этап"}, {value: 2, label: "1/8 финала"},
        {value: 3, label: "1/4 финала"}, {value: 4, label: "1/2 финала"},
        {value: 5, label: "Финал"}, {value: 6, label: "Матч за 3 место"},
    ];
    const phaseOptions = [
        {value: 1, label: "Закончен"}, {value: 2, label: "Отменен"},
        {value: 3, label: "Идет"}, {value: 4, label: "Запланирован"},
    ];

    return (
        <Modal opened={opened} onClose={onClose} title={isEditing ? "Редактировать матч" : "Добавить матч"} size="xl"
               centered>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <Grid>
                        <Grid.Col span={6}>
                            <Select label="Гостевая команда" data={teamOptions} {...form.getInputProps("teamGuestId")}
                                    required/>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Select label="Домашняя команда" data={teamOptions} {...form.getInputProps("teamHostId")}
                                    required/>
                        </Grid.Col>
                    </Grid>
                    <Grid>
                        <Grid.Col span={6}>
                            <Select label="Судья" data={refereeOptions} {...form.getInputProps("refereeId")} required/>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Select label="Город" data={cityOptions} {...form.getInputProps("cityId")} required/>
                        </Grid.Col>
                    </Grid>
                    <Grid>
                        <Grid.Col span={6}>
                            <Select label="Стадия" data={stageOptions} {...form.getInputProps("stageType")} required/>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Select label="Статус" data={phaseOptions} {...form.getInputProps("phaseType")} required/>
                        </Grid.Col>
                    </Grid>
                    <Grid>
                        <Grid.Col span={6}>
                            <NumberInput label="Очки гостей" min={0} {...form.getInputProps("guestCount")} required/>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <NumberInput label="Очки хозяев" min={0} {...form.getInputProps("hostCount")} required/>
                        </Grid.Col>
                    </Grid>
                    <TextInput label="Дата и время" type="datetime-local" {...form.getInputProps("dateTime")} required/>
                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={onClose}>Отмена</Button>
                        <Button type="submit" loading={isSaving || isChecking}>
                            {isEditing ? "Сохранить" : "Добавить"}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

type MatchCardProps = {
    match: Match;
    isAdmin: boolean;
    onEdit: (match: Match) => void;
};

const MatchCard: FC<MatchCardProps> = ({match, isAdmin, onEdit}) => {
    const {deleteMatch, isDeleting} = useMatchMutation();

    const formatDateTime = (dateTime: string) => {
        const date = new Date(dateTime);
        return date.toLocaleString("ru-RU", {
            day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
        });
    };

    const getStageName = (stageType: number) => {
        const stages: Record<number, string> = {
            1: "Групповой этап", 2: "1/8 финала", 3: "1/4 финала",
            4: "1/2 финала", 5: "Финал", 6: "Матч за 3 место"
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
                    <Badge color={getStatusColor(match.phaseType)} variant="light">
                        {getStatusName(match.phaseType)}
                    </Badge>
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
                    <Text size="sm"><strong>Дата:</strong> {formatDateTime(match.dateTime)}</Text>
                </Stack>
            </CardSection>
            {isAdmin && (
                <Group justify="flex-end" mt="md">
                    <Button variant="light" onClick={() => onEdit(match)}>Редактировать</Button>
                    <Button onClick={() => deleteMatch(match.id)} loading={isDeleting}>Удалить</Button>
                </Group>
            )}
        </Card>
    );
};

export default Matches;