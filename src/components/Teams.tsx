import { type FC, useState, useEffect } from "react";
import { exportTeamsToCSV } from "../hooks/useExport";
import type { City, Team } from "../types";
import {
    Button,
    Card,
    CardSection,
    Group,
    Modal,
    NumberInput,
    Select,
    Stack,
    Text,
    TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTeamMutation, useTeamsQuery } from "../hooks/useTeams";
import { useCitiesQuery } from "../hooks/useCities";
import { useAuth } from "../context/AuthContext";
import "@mantine/core/styles.css";

const Teams = () => {
    const { data: teams } = useTeamsQuery();
    const [modalOpened, setModalOpened] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const { isAuthenticated, isAdmin } = useAuth();

    return (
        <div>
            <Group justify="space-between" align="center">
                <h1>Команды</h1>
                <Group>
                    {isAuthenticated && (
                        <Button variant="outline" onClick={() => exportTeamsToCSV(teams || [])}>
                            Сохранить CSV
                        </Button>
                    )}
                    {isAdmin && (
                        <Button onClick={() => setModalOpened(true)}>Добавить</Button>
                    )}
                </Group>
            </Group>
            <Stack gap="md" mt="xl">
                {teams?.map((team) => (
                    <TeamCard key={team.id} team={team} isAdmin={isAdmin} onEdit={setEditingTeam} />
                ))}
            </Stack>

            {isAdmin && (
                <TeamForm opened={modalOpened} onClose={() => setModalOpened(false)} />
            )}

            <TeamEditForm
                opened={!!editingTeam}
                onClose={() => setEditingTeam(null)}
                team={editingTeam}
            />
        </div>
    );
};

type TeamFormProps = {
    opened: boolean;
    onClose: () => void;
};

const TeamForm: FC<TeamFormProps> = ({ opened, onClose }) => {
    const { addTeam, isAdding } = useTeamMutation();
    const { data: cities } = useCitiesQuery();
    const form = useForm({
        initialValues: {
            name: "",
            peoplesInTeam: 0,
            numOfWin: 0,
            cityId: null as number | null,
        },
        validate: {
            name: (value) => (value.trim().length === 0 ? "Введите название команды" : null),
            peoplesInTeam: (value) => (value <= 0 ? "Количество игроков должно быть больше 0" : null),
            numOfWin: (value) => (value < 0 ? "Количество побед не может быть отрицательным" : null),
            cityId: (value) => (!value ? "Выберите город" : null),
        },
    });

    const handleSubmit = async (values: typeof form.values) => {
        const cityId = typeof values.cityId === "string" ? parseInt(values.cityId) : values.cityId;
        const selectedCity = cities?.find((city) => city.id === cityId);
        if (!selectedCity) {
            form.setFieldError("cityId", "Город не найден");
            return;
        }

        const teamData = {
            name: values.name,
            peoplesInTeam: values.peoplesInTeam,
            numOfWin: values.numOfWin,
            city: selectedCity,
        };

        await addTeam(teamData);
        form.reset();
        onClose();
    };

    const cityOptions =
        cities?.map((city: City) => ({
            value: city.id.toString(),
            label: `${city.name} (${city.country})`,
        })) || [];

    return (
        <Modal opened={opened} onClose={onClose} title="Добавить новую команду" size="lg" centered>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <TextInput label="Название команды" placeholder="Введите название команды" {...form.getInputProps("name")} required />
                    <NumberInput label="Количество игроков" min={1} {...form.getInputProps("peoplesInTeam")} required />
                    <NumberInput label="Количество побед" min={0} {...form.getInputProps("numOfWin")} required />
                    <Select label="Город" placeholder="Выберите город" data={cityOptions} {...form.getInputProps("cityId")} required />
                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={onClose}>Отмена</Button>
                        <Button type="submit" loading={isAdding}>Добавить команду</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

type TeamEditFormProps = {
    opened: boolean;
    onClose: () => void;
    team: Team | null;
};

const TeamEditForm: FC<TeamEditFormProps> = ({ opened, onClose, team }) => {
    const { updateTeam, isUpdating } = useTeamMutation();
    const { data: cities } = useCitiesQuery();
    const form = useForm({
        initialValues: {
            name: "",
            peoplesInTeam: 0,
            numOfWin: 0,
            cityId: null as number | null,
        },
        validate: {
            name: (value) => (value.trim().length === 0 ? "Введите название команды" : null),
            peoplesInTeam: (value) => (value <= 0 ? "Количество игроков должно быть больше 0" : null),
            numOfWin: (value) => (value < 0 ? "Количество побед не может быть отрицательным" : null),
            cityId: (value) => (!value ? "Выберите город" : null),
        },
    });

    useEffect(() => {
        if (team && opened) {
            form.setValues({
                name: team.name,
                peoplesInTeam: team.peoplesInTeam,
                numOfWin: team.numOfWin,
                cityId: team.city?.id || null,
            });
        }
    }, [team, opened]);

    const handleSubmit = async (values: typeof form.values) => {
        if (!team) return;

        const cityId = typeof values.cityId === "string" ? parseInt(values.cityId) : values.cityId;
        const selectedCity = cities?.find((city) => city.id === cityId);
        if (!selectedCity) {
            form.setFieldError("cityId", "Город не найден");
            return;
        }

        try {
            await updateTeam({
                id: team.id,
                name: values.name,
                peoplesInTeam: values.peoplesInTeam,
                numOfWin: values.numOfWin,
                city: selectedCity,
            });
            form.reset();
            onClose();
        } catch (error) {
            console.error("Ошибка при обновлении команды:", error);
            alert("Произошла ошибка при сохранении команды");
        }
    };

    const cityOptions =
        cities?.map((city: City) => ({
            value: city.id.toString(),
            label: `${city.name} (${city.country})`,
        })) || [];

    return (
        <Modal opened={opened} onClose={onClose} title="Редактировать команду" size="lg" centered>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <TextInput label="Название команды" {...form.getInputProps("name")} required />
                    <NumberInput label="Количество игроков" min={1} {...form.getInputProps("peoplesInTeam")} required />
                    <NumberInput label="Количество побед" min={0} {...form.getInputProps("numOfWin")} required />
                    <Select label="Город" placeholder="Выберите город" data={cityOptions} {...form.getInputProps("cityId")} required />
                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={onClose}>Отмена</Button>
                        <Button type="submit" loading={isUpdating}>Сохранить изменения</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

type TeamCardProps = {
    team: Team;
    isAdmin: boolean;
    onEdit: (team: Team) => void;
};

const TeamCard: FC<TeamCardProps> = ({ team, isAdmin, onEdit }) => {
    const { deleteTeam, isDeleting } = useTeamMutation();
    const handleDelete = () => {
        if (confirm(`Удалить команду ${team.name}?`)) {
            deleteTeam(team.id);
        }
    };

    return (
        <Card withBorder padding="lg" radius="md">
            <CardSection inheritPadding py="xs">
                <Group justify="space-between">
                    <Text fw={500} size="lg">{team.name}</Text>
                </Group>
            </CardSection>
            <CardSection inheritPadding py="xs">
                <Stack gap="xs">
                    <Text size="sm"><strong>Город:</strong> {team.city?.name} ({team.city?.country})</Text>
                    <Text size="sm"><strong>Количество игроков:</strong> {team.peoplesInTeam}</Text>
                    <Text size="sm"><strong>Количество побед:</strong> {team.numOfWin}</Text>
                </Stack>
            </CardSection>
            {isAdmin && (
                <Group justify="flex-end" mt="md">
                    <Button variant="light" onClick={() => onEdit(team)}>Редактировать</Button>
                    <Button onClick={handleDelete} loading={isDeleting}>Удалить</Button>
                </Group>
            )}
        </Card>
    );
};

export default Teams;