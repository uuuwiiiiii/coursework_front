import { type FC, useState, useEffect } from "react";
import { exportCitiesToCSV } from "../hooks/useExport";
import type { City } from "../types";
import {
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
import { useAuth } from "../context/AuthContext";

const Cities = () => {
    const { data: cities } = useCitiesQuery();
    const [modalOpened, setModalOpened] = useState(false);
    const [editingCity, setEditingCity] = useState<City | null>(null);
    const { isAuthenticated, isAdmin } = useAuth();

    const handleCloseModal = () => {
        setModalOpened(false);
        setEditingCity(null);
    };

    return (
        <div>
            <Group justify="space-between" align="center">
                <h1>Города</h1>
                <Group>
                    {isAuthenticated && (
                        <Button variant="outline" onClick={() => exportCitiesToCSV(cities || [])}>
                            Сохранить CSV
                        </Button>
                    )}
                    {isAdmin && (
                        <Button onClick={() => setModalOpened(true)}>Добавить</Button>
                    )}
                </Group>
            </Group>
            <Stack gap="md" mt="xl">
                {cities?.map((city) => (
                    <CityCard key={city.id} city={city} isAdmin={isAdmin} onEdit={setEditingCity} />
                ))}
            </Stack>

            <CityForm
                opened={modalOpened || !!editingCity}
                onClose={handleCloseModal}
                editingCity={editingCity}
            />
        </div>
    );
};

type CityFormProps = {
    opened: boolean;
    onClose: () => void;
    editingCity: City | null;
};

const CityForm: FC<CityFormProps> = ({ opened, onClose, editingCity }) => {
    const { addCity, updateCity, isAdding, isUpdating } = useCityMutation();
    const isEditing = !!editingCity;
    const isSaving = isAdding || isUpdating;

    const form = useForm({
        initialValues: {
            name: "",
            country: "",
        },
        validate: {
            name: (value) => (value.trim().length === 0 ? "Введите название города" : null),
            country: (value) => (value.trim().length === 0 ? "Введите страну" : null),
        },
    });

    useEffect(() => {
        if (editingCity && opened) {
            form.setValues({
                name: editingCity.name,
                country: editingCity.country,
            });
        } else if (!opened) {
            form.reset();
        }
    }, [editingCity, opened]);

    const handleSubmit = async (values: { name: string; country: string }) => {
        if (isEditing && editingCity) {
            updateCity({
                id: editingCity.id,
                name: values.name,
                country: values.country,
            });
        } else {
            addCity(values);
        }
        form.reset();
        onClose();
    };

    return (
        <Modal opened={opened} onClose={onClose} title={isEditing ? "Редактировать город" : "Добавить город"} centered>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <TextInput label="Название города" placeholder="Введите название города" {...form.getInputProps("name")} required />
                    <TextInput label="Страна" placeholder="Введите название страны" {...form.getInputProps("country")} required />
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

type CityCardProps = {
    city: City;
    isAdmin: boolean;
    onEdit: (city: City) => void;
};

const CityCard: FC<CityCardProps> = ({ city, isAdmin, onEdit }) => {
    const { deleteCity, isDeleting } = useCityMutation();

    return (
        <Card withBorder padding="lg" radius="md">
            <CardSection inheritPadding py="xs">
                <Group justify="space-between">
                    <Text fw={500} size="lg">{city.name}</Text>
                </Group>
            </CardSection>
            <CardSection inheritPadding py="xs">
                <Text size="sm" c="dimmed">Страна: {city.country}</Text>
            </CardSection>
            {isAdmin && (
                <Group justify="flex-end" mt="md">
                    <Button variant="light" onClick={() => onEdit(city)}>Редактировать</Button>
                    <Button onClick={() => deleteCity(city.id)} loading={isDeleting}>Удалить</Button>
                </Group>
            )}
        </Card>
    );
};

export default Cities;