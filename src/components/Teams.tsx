import { type FC, useState } from "react";
import type { City, Team } from "../types";
import {
	Badge,
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
import { useAuth } from "../context/AuthContext.tsx";
import "@mantine/core/styles.css";

const Teams = () => {
	const { data: teams } = useTeamsQuery();
	const [modalOpened, setModalOpened] = useState(false);
	const { isAuthenticated } = useAuth();

	const handleCloseModal = () => {
		setModalOpened(false);
	};

	return (
		<div>
			<Group justify="space-between" align="center">
				<h1>Команды</h1>
				{isAuthenticated && (
					<Button m="xl" onClick={() => setModalOpened(true)}>
						Добавить
					</Button>
				)}
			</Group>
			<Stack gap="md" mt="xl">
				{teams?.map((team) => (
					<Team key={team.id} team={team} isAuthenticated={isAuthenticated} />
				))}
			</Stack>

			{isAuthenticated && (
				<TeamForm opened={modalOpened} onClose={handleCloseModal} />
			)}
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
			name: (value) =>
				value.trim().length === 0 ? "Введите название команды" : null,
			peoplesInTeam: (value) =>
				value <= 0 ? "Количество игроков должно быть больше 0" : null,
			numOfWin: (value) =>
				value < 0 ? "Количество побед не может быть отрицательным" : null,
			cityId: (value) => (!value ? "Выберите город" : null),
		},
	});

	const handleSubmit = async (values: typeof form.values) => {
		const selectedCity = cities?.find((city) => city.id === values.cityId);
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

		addTeam(teamData);
		form.reset();
		onClose();
	};

	const cityOptions =
		cities?.map((city: City) => ({
			value: city.id.toString(),
			label: `${city.name} (${city.country})`,
		})) || [];

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title="Добавить новую команду"
			size="lg"
			centered
		>
			<form onSubmit={form.onSubmit(handleSubmit)}>
				<Stack gap="md">
					<TextInput
						label="Название команды"
						placeholder="Введите название команды"
						{...form.getInputProps("name")}
						required
					/>
					<NumberInput
						label="Количество игроков"
						min={1}
						{...form.getInputProps("peoplesInTeam")}
						required
					/>
					<NumberInput
						label="Количество побед"
						min={0}
						{...form.getInputProps("numOfWin")}
						required
					/>
					<Select
						label="Город"
						placeholder="Выберите город"
						data={cityOptions}
						{...form.getInputProps("cityId")}
						required
					/>
					<Group justify="flex-end" mt="md">
						<Button variant="light" onClick={onClose}>
							Отмена
						</Button>
						<Button type="submit" loading={isAdding}>
							Добавить команду
						</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	);
};

type TeamProps = {
	team: Team;
	isAuthenticated: boolean;
};

const Team: FC<TeamProps> = ({ team, isAuthenticated }) => {
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
					<Text fw={500} size="lg">
						{team.name}
					</Text>
					<Badge color="blue" variant="light">
						ID: {team.id}
					</Badge>
				</Group>
			</CardSection>
			<CardSection inheritPadding py="xs">
				<Stack gap="xs">
					<Text size="sm">
						<strong>Город:</strong> {team.city?.name} ({team.city?.country})
					</Text>
					<Text size="sm">
						<strong>Количество игроков:</strong> {team.peoplesInTeam}
					</Text>
					<Text size="sm">
						<strong>Количество побед:</strong> {team.numOfWin}
					</Text>
				</Stack>
			</CardSection>
			{isAuthenticated && (
				<Group justify="flex-end" mt="md">
					<Button onClick={handleDelete} loading={isDeleting}>
						Удалить
					</Button>
				</Group>
			)}
		</Card>
	);
};

export default Teams;