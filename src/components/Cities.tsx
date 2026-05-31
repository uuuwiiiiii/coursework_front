import { type FC, useState } from "react";
import type { City } from "../types";
import {
	Badge,
	Button,
	Card,
	CardSection,
	Group,
	Modal,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useCitiesQuery, useCityMutation } from "../hooks/useCities";
import { useForm } from "@mantine/form";
import "@mantine/core/styles.css";
import { useAuth } from "../context/AuthContext.tsx";

const Cities = () => {
	const { data: cities } = useCitiesQuery();
	const [modalOpened, setModalOpened] = useState(false);
	const { isAuthenticated } = useAuth();

	return (
		<div>
			<Group justify="space-between" align="center">
				<h1>Города </h1>
				{isAuthenticated && (
					<Button m="xl" onClick={() => setModalOpened(true)}>
						Добавить
					</Button>
				)}
			</Group>
			<Stack gap="md" mt="xl">
				{cities?.map((city) => (
					<City city={city} isAuthenticated={isAuthenticated} />
				))}
			</Stack>

			<CityAddForm opened={modalOpened} onClose={() => setModalOpened(false)} />
		</div>
	);
};

type CityAddFormProps = {
	opened: boolean;
	onClose: () => void;
};

const CityAddForm: FC<CityAddFormProps> = ({ opened, onClose }) => {
	const { addCity, isAdding } = useCityMutation();

	const form = useForm({
		initialValues: {
			name: "",
			country: "",
		},
		validate: {
			name: (value) =>
				value.trim().length === 0 ? "Введите название города" : null,
			country: (value) => (value.trim().length === 0 ? "Введите страну" : null),
		},
	});

	const handleSubmit = async (values: { name: string; country: string }) => {
		addCity(values);
		form.reset();
		onClose();
	};

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title="Добавить новый город"
			centered
		>
			<form onSubmit={() => handleSubmit(form.values)}>
				<Stack gap="md">
					<TextInput
						label="Название города"
						placeholder="Введите название города"
						{...form.getInputProps("name")}
						required
					/>
					<TextInput
						label="Страна"
						placeholder="Введите название страны"
						{...form.getInputProps("country")}
						required
					/>
					<Group justify="flex-end" mt="md">
						<Button variant="light" onClick={onClose}>
							Отмена
						</Button>
						<Button type="submit" loading={isAdding}>
							Добавить город
						</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	);
};

type CityProps = {
	city: City;
	isAuthenticated: boolean;
};

const City: FC<CityProps> = ({ city, isAuthenticated }) => {
	const { deleteCity } = useCityMutation();

	const handleDelete = () => {
		if (confirm(`Удалить город ${city.name}?`)) {
			deleteCity(city.id);
		}
	};

	return (
		<Card withBorder padding="lg" radius="md">
			<CardSection inheritPadding py="xs">
				<Group justify="space-between">
					<Text fw={500} size="lg">
						{city.name}
					</Text>
					<Badge color="blue" variant="light">
						ID: {city.id}
					</Badge>
				</Group>
			</CardSection>
			<Group justify="right">
				{isAuthenticated && <Button onClick={handleDelete}>Удалить</Button>}
			</Group>
			<CardSection inheritPadding py="xs">
				<Text size="sm" c="dimmed">
					Страна: {city.country}
				</Text>
			</CardSection>
		</Card>
	);
};

export default Cities;
