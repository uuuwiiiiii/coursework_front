import { type FC, useState } from "react";
import type { City, Match, Referee, Team } from "../types";
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
import { useForm } from "@mantine/form";
import { useMatchesQuery, useMatchMutation } from "../hooks/useMatches";
import { useTeamsQuery } from "../hooks/useTeams";
import { useRefereesQuery } from "../hooks/useReferees";
import { useCitiesQuery } from "../hooks/useCities";
import { useAuth } from "../context/AuthContext.tsx";
import "@mantine/core/styles.css";

const Matches = () => {
	const { data: matches } = useMatchesQuery();
	const [modalOpened, setModalOpened] = useState(false);
	const { isAuthenticated } = useAuth();

	return (
		<div>
			<Group justify="space-between" align="center">
				<h1>Матчи</h1>
				{isAuthenticated && (
					<Button m="xl" onClick={() => setModalOpened(true)}>
						Добавить
					</Button>
				)}
			</Group>
			<Stack gap="md" mt="xl">
				{matches?.map((match) => (
					<Match key={match.id} match={match} isAuthenticated={isAuthenticated} />
				))}
			</Stack>

			{isAuthenticated && (
				<MatchForm opened={modalOpened} onClose={() => setModalOpened(false)} />
			)}
		</div>
	);
};

type MatchFormProps = {
	opened: boolean;
	onClose: () => void;
};

const MatchForm: FC<MatchFormProps> = ({ opened, onClose }) => {
	const { addMatch, isAdding } = useMatchMutation();
	const { data: teams } = useTeamsQuery();
	const { data: referees } = useRefereesQuery();
	const { data: cities } = useCitiesQuery();

	const form = useForm({
		initialValues: {
			teamGuestId: null as number | null,
			teamHostId: null as number | null,
			refereeId: null as number | null,
			cityId: null as number | null,
			stageType: 1,
			phaseType: 1,
			guestCount: 0,
			hostCount: 0,
			dateTime: "",
		},
		validate: {
			teamGuestId: (value) => (!value ? "Выберите гостевую команду" : null),
			teamHostId: (value) => (!value ? "Выберите домашнюю команду" : null),
			refereeId: (value) => (!value ? "Выберите судью" : null),
			cityId: (value) => (!value ? "Выберите город" : null),
			guestCount: (value) =>
				value < 0 ? "Количество очков не может быть отрицательным" : null,
			hostCount: (value) =>
				value < 0 ? "Количество очков не может быть отрицательным" : null,
			dateTime: (value) => (!value ? "Выберите дату и время" : null),
		},
	});

	const handleSubmit = async (values: typeof form.values) => {
		const selectedTeamGuest = teams?.find(
			(team) => team.id === values.teamGuestId,
		);
		const selectedTeamHost = teams?.find(
			(team) => team.id === values.teamHostId,
		);
		const selectedReferee = referees?.find(
			(referee) => referee.id === values.refereeId,
		);
		const selectedCity = cities?.find((city) => city.id === values.cityId);

		const matchData = {
			teamGuest: selectedTeamGuest!,
			teamHost: selectedTeamHost!,
			referee: selectedReferee!,
			city: selectedCity!,
			stageType: values.stageType,
			phaseType: values.phaseType,
			guestCount: values.guestCount,
			hostCount: values.hostCount,
			dateTime: values.dateTime,
		};

		addMatch(matchData);
		form.reset();
		onClose();
	};

	const teamOptions =
		teams?.map((team: Team) => ({
			value: team.id.toString(),
			label: `${team.name} (${team.city?.name})`,
		})) || [];

	const refereeOptions =
		referees?.map((referee: Referee) => ({
			value: referee.id.toString(),
			label: `${referee.FIO} (${referee.city?.name})`,
		})) || [];

	const cityOptions =
		cities?.map((city: City) => ({
			value: city.id.toString(),
			label: `${city.name} (${city.country})`,
		})) || [];

	const stageOptions = [
		{ value: "1", label: "Групповой этап" },
		{ value: "2", label: "1/8 финала" },
		{ value: "3", label: "1/4 финала" },
		{ value: "4", label: "1/2 финала" },
		{ value: "5", label: "Финал" },
		{ value: "6", label: "Матч за 3 место" },
	];

	const phaseOptions = [
		{ value: "1", label: "1 тур" },
		{ value: "2", label: "2 тур" },
		{ value: "3", label: "3 тур" },
		{ value: "4", label: "4 тур" },
	];

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title="Добавить новый матч"
			size="xl"
			centered
		>
			<form onSubmit={form.onSubmit(handleSubmit)}>
				<Stack gap="md">
					<Grid>
						<Grid.Col span={6}>
							<Select
								label="Гостевая команда"
								placeholder="Выберите команду"
								data={teamOptions}
								{...form.getInputProps("teamGuestId")}
								required
							/>
						</Grid.Col>
						<Grid.Col span={6}>
							<Select
								label="Домашняя команда"
								placeholder="Выберите команду"
								data={teamOptions}
								{...form.getInputProps("teamHostId")}
								required
							/>
						</Grid.Col>
					</Grid>

					<Grid>
						<Grid.Col span={6}>
							<Select
								label="Судья"
								placeholder="Выберите судью"
								data={refereeOptions}
								{...form.getInputProps("refereeId")}
								required
							/>
						</Grid.Col>
						<Grid.Col span={6}>
							<Select
								label="Город"
								placeholder="Выберите город"
								data={cityOptions}
								{...form.getInputProps("cityId")}
								required
							/>
						</Grid.Col>
					</Grid>

					<Grid>
						<Grid.Col span={6}>
							<Select
								label="Стадия турнира"
								data={stageOptions}
								{...form.getInputProps("stageType")}
								required
							/>
						</Grid.Col>
						<Grid.Col span={6}>
							<Select
								label="Фаза"
								data={phaseOptions}
								{...form.getInputProps("phaseType")}
								required
							/>
						</Grid.Col>
					</Grid>

					<Grid>
						<Grid.Col span={6}>
							<NumberInput
								label="Очки гостей"
								min={0}
								{...form.getInputProps("guestCount")}
								required
							/>
						</Grid.Col>
						<Grid.Col span={6}>
							<NumberInput
								label="Очки хозяев"
								min={0}
								{...form.getInputProps("hostCount")}
								required
							/>
						</Grid.Col>
					</Grid>

					<TextInput
						label="Дата и время"
						type="datetime-local"
						{...form.getInputProps("dateTime")}
						required
					/>

					<Group justify="flex-end" mt="md">
						<Button variant="light" onClick={onClose}>
							Отмена
						</Button>
						<Button type="submit" loading={isAdding}>
							Добавить матч
						</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	);
};

type MatchProps = {
	match: Match;
	isAuthenticated: boolean;
};

const Match: FC<MatchProps> = ({ match, isAuthenticated }) => {
	const { deleteMatch, isDeleting } = useMatchMutation();

	const handleDelete = () => {
		if (
			confirm(`Удалить матч ${match.teamGuest.name} vs ${match.teamHost.name}?`)
		) {
			deleteMatch(match.id);
		}
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

	return (
		<Card withBorder padding="lg" radius="md">
			<CardSection inheritPadding py="xs">
				<Group justify="space-between">
					<Text fw={500} size="lg">
						{match.teamGuest.name} vs {match.teamHost.name}
					</Text>
					<Badge color="blue" variant="light">
						ID: {match.id}
					</Badge>
				</Group>
			</CardSection>

			<CardSection inheritPadding py="xs">
				<Stack gap="xs">
					<Group justify="center" gap="xl">
						<Text size="xl" fw={700}>
							{match.guestCount}
						</Text>
						<Text size="xl" fw={700}>
							:
						</Text>
						<Text size="xl" fw={700}>
							{match.hostCount}
						</Text>
					</Group>

					<Divider />

					<Text size="sm">
						<strong>Судья:</strong> {match.referee.FIO}
					</Text>
					<Text size="sm">
						<strong>Город:</strong> {match.city.name} ({match.city.country})
					</Text>
					<Text size="sm">
						<strong>Стадия:</strong> {getStageName(match.stageType)} / Фаза:{" "}
						{match.phaseType}
					</Text>
					<Text size="sm">
						<strong>Дата и время:</strong> {formatDateTime(match.dateTime)}
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

export default Matches;