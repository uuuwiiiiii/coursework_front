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

    const handleCloseModal = () => {
        setModalOpened(false);
        setEditingTeam(null);
    };

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

            <TeamForm
                opened={modalOpened || !!editingTeam}
                onClose={handleCloseModal}
                editingTeam={editingTeam}
            />
        </div>
    );
};

type TeamFormProps = {
    opened: boolean;
    onClose: () => void;
    editingTeam: Team | null;
};

const TeamForm: FC<TeamFormProps> = ({ opened, onClose, editingTeam }) => {
    const { addTeam, updateTeam, isAdding, isUpdating } = useTeamMutation();
    const { data: cities } = useCitiesQuery();
    const isEditing = !!editingTeam;
    const isSaving = isAdding || isUpdating;

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
        if (editingTeam && opened) {
            form.setValues({
                name: editingTeam.name,
                peoplesInTeam: editingTeam.peoplesInTeam,
                numOfWin: editingTeam.numOfWin,
                cityId: editingTeam.city?.id || null,
            });
        } else if (!opened) {
            form.reset();
        }
    }, [editingTeam, opened]);

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

        if (isEditing && editingTeam) {
            await updateTeam({ id: editingTeam.id, ...teamData });
        } else {
            await addTeam(teamData);
        }
        form.reset();
        onClose();
    };

    const cityOptions = cities?.map((city: City) => ({
        value: city.id.toString(),
        label: `${city.name} (${city.country})`,
    })) || [];

    return (
        <Modal opened={opened} onClose={onClose} title={isEditing ? "Редактировать команду" : "Добавить команду"} size="lg" centered>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <TextInput label="Название команды" placeholder="Введите название команды" {...form.getInputProps("name")} required />
                    <NumberInput label="Количество игроков" min={1} {...form.getInputProps("peoplesInTeam")} required />
                    <NumberInput label="Количество побед" min={0} {...form.getInputProps("numOfWin")} required />
                    <Select label="Город" placeholder="Выберите город" data={cityOptions} {...form.getInputProps("cityId")} required />
                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={onClose}>Отмена</Button>
                        <Button type="submit" loading={isSaving}>
                            {isEditing ? "Сохранить" : "Добавить"}
                        </Button>
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
                    <Button onClick={() => deleteTeam(team.id)} loading={isDeleting}>Удалить</Button>
                </Group>
            )}
        </Card>
    );
};

export default Teams;