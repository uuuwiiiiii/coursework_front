import { type FC, useState } from "react";
import type { City, Referee } from "../types";
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
import { useRefereeMutation, useRefereesQuery } from "../hooks/useReferees";
import { useCitiesQuery } from "../hooks/useCities";
import { useAuth } from "../context/AuthContext.tsx";
import "@mantine/core/styles.css";

const Referees = () => {
	const { data: referees } = useRefereesQuery();
	const [modalOpened, setModalOpened] = useState(false);
	const { isAuthenticated } = useAuth();

	const handleCloseModal = () => {
		setModalOpened(false);
	};

	return (
		<div>
			<Group justify="space-between" align="center">
				<h1>Судьи</h1>
				{isAuthenticated && (
					<Button m="xl" onClick={() => setModalOpened(true)}>
						Добавить
					</Button>
				)}
			</Group>
			<Stack gap="md" mt="xl">
				{referees?.map((referee) => (
					<Referee key={referee.id} referee={referee} isAuthenticated={isAuthenticated} />
				))}
			</Stack>

			{isAuthenticated && (
				<RefereeForm opened={modalOpened} onClose={handleCloseModal} />
			)}
		</div>
	);
};

type RefereeFormProps = {
	opened: boolean;
	onClose: () => void;
};

const RefereeForm: FC<RefereeFormProps> = ({ opened, onClose }) => {
	const { addReferee, isAdding } = useRefereeMutation();
	const { data: cities } = useCitiesQuery();

	const form = useForm({
		initialValues: {
			fio: "",
			license: "",
			stageYears: 0,
			cityId: null as number | null,
		},
		validate: {
			fio: (value) => (value.trim().length === 0 ? "Введите ФИО судьи" : null),
			license: (value) =>
				value.trim().length === 0 ? "Введите номер лицензии" : null,
			stageYears: (value) =>
				value < 0 ? "Стаж не может быть отрицательным" : null,
			cityId: (value) => (!value ? "Выберите город" : null),
		},
	});

	const handleSubmit = async (values: typeof form.values) => {
		const cityId =
			typeof values.cityId === "string"
				? parseInt(values.cityId)
				: values.cityId;
		const selectedCity = cities?.find((city) => city.id === cityId);
		if (!selectedCity) {
			form.setFieldError("cityId", "Город не найден");
			return;
		}

		const refereeData = {
			FIO: values.fio,
			license: values.license,
			stageYears: values.stageYears,
			city: {
				id: selectedCity.id,
				name: selectedCity.name,
				country: selectedCity.country,
			},
		};
		console.log("Отправляемые данные:", refereeData);
		addReferee(refereeData);
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
			title="Добавить нового судью"
			size="lg"
			centered
		>
			<form onSubmit={form.onSubmit(handleSubmit)}>
				<Stack gap="md">
					<TextInput
						label="ФИО судьи"
						placeholder="Иванов Иван Иванович"
						{...form.getInputProps("fio")}
						required
					/>
					<TextInput
						label="Номер лицензии"
						placeholder="Введите номер лицензии"
						{...form.getInputProps("license")}
						required
					/>
					<NumberInput
						label="Стаж работы (лет)"
						min={0}
						{...form.getInputProps("stageYears")}
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
							Добавить судью
						</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	);
};

type RefereeProps = {
	referee: Referee;
	isAuthenticated: boolean;
};

const Referee: FC<RefereeProps> = ({ referee, isAuthenticated }) => {
	const { deleteReferee, isDeleting } = useRefereeMutation();

	const handleDelete = () => {
		if (confirm(`Удалить судью ${referee.FIO}?`)) {
			deleteReferee(referee.id);
		}
	};

	return (
		<Card withBorder padding="lg" radius="md">
			<CardSection inheritPadding py="xs">
				<Group justify="space-between">
					<Text fw={500} size="lg">
						{referee.FIO}
					</Text>
					<Badge color="blue" variant="light">
						ID: {referee.id}
					</Badge>
				</Group>
			</CardSection>
			<CardSection inheritPadding py="xs">
				<Stack gap="xs">
					<Text size="sm">
						<strong>Лицензия:</strong> {referee.license}
					</Text>
					<Text size="sm">
						<strong>Стаж:</strong> {referee.stageYears}{" "}
						{getYearsWord(referee.stageYears)}
					</Text>
					<Text size="sm">
						<strong>Город:</strong> {referee.city?.name} (
						{referee.city?.country})
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

function getYearsWord(years: number): string {
	const lastDigit = years % 10;
	const lastTwoDigits = years % 100;

	if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
		return "лет";
	}
	if (lastDigit === 1) {
		return "год";
	}
	if (lastDigit >= 2 && lastDigit <= 4) {
		return "года";
	}
	return "лет";
}

export default Referees;