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

            {isAdmin && (
                <CityAddForm opened={modalOpened} onClose={() => setModalOpened(false)} />
            )}

            <CityEditForm
                opened={!!editingCity}
                onClose={() => setEditingCity(null)}
                city={editingCity}
            />
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
            name: (value) => (value.trim().length === 0 ? "Введите название города" : null),
            country: (value) => (value.trim().length === 0 ? "Введите страну" : null),
        },
    });

    const handleSubmit = async (values: { name: string; country: string }) => {
        await addCity(values);
        form.reset();
        onClose();
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Добавить новый город" centered>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <TextInput label="Название города" placeholder="Введите название города" {...form.getInputProps("name")} required />
                    <TextInput label="Страна" placeholder="Введите название страны" {...form.getInputProps("country")} required />
                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={onClose}>Отмена</Button>
                        <Button type="submit" loading={isAdding}>Добавить город</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

type CityEditFormProps = {
    opened: boolean;
    onClose: () => void;
    city: City | null;
};

const CityEditForm: FC<CityEditFormProps> = ({ opened, onClose, city }) => {
    const { updateCity, isUpdating } = useCityMutation();
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
        if (city && opened) {
            form.setValues({
                name: city.name,
                country: city.country,
            });
        }
    }, [city, opened]);

    const handleSubmit = async (values: { name: string; country: string }) => {
        if (!city) return;

        try {
            await updateCity({
                id: city.id,
                name: values.name,
                country: values.country,
            });
            form.reset();
            onClose();
        } catch (error) {
            console.error("Ошибка при обновлении города:", error);
            alert("Произошла ошибка при сохранении города");
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Редактировать город" centered>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <TextInput label="Название города" placeholder="Введите название города" {...form.getInputProps("name")} required />
                    <TextInput label="Страна" placeholder="Введите название страны" {...form.getInputProps("country")} required />
                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={onClose}>Отмена</Button>
                        <Button type="submit" loading={isUpdating}>Сохранить изменения</Button>
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
    const handleDelete = () => {
        if (confirm(`Удалить город ${city.name}?`)) {
            deleteCity(city.id);
        }
    };

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
                    <Button onClick={handleDelete} loading={isDeleting}>Удалить</Button>
                </Group>
            )}
        </Card>
    );
};

export default Cities;