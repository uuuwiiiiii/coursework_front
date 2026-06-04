import { type FC, useState, useEffect } from "react";
import { exportRefereesToCSV } from "../hooks/useExport";
import type { City, Referee } from "../types";
import { Button, Card, CardSection, Group, Modal, NumberInput, Select, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useRefereeMutation, useRefereesQuery } from "../hooks/useReferees";
import { useCitiesQuery } from "../hooks/useCities";
import { useAuth } from "../context/AuthContext";
import "@mantine/core/styles.css";

const Referees = () => {
    const { data: referees } = useRefereesQuery();
    const [modalOpened, setModalOpened] = useState(false);
    const [editingReferee, setEditingReferee] = useState<Referee | null>(null);
    const { isAuthenticated, isAdmin } = useAuth();

    const handleCloseModal = () => {
        setModalOpened(false);
        setEditingReferee(null);
    };

    return (
        <div>
            <Group justify="space-between" align="center">
                <h1>Судьи</h1>
                <Group>
                    {isAuthenticated && (
                        <Button variant="outline" onClick={() => exportRefereesToCSV(referees || [])}>
                            Сохранить CSV
                        </Button>
                    )}
                    {isAdmin && (
                        <Button onClick={() => setModalOpened(true)}>Добавить</Button>
                    )}
                </Group>
            </Group>
            <Stack gap="md" mt="xl">
                {referees?.map((referee) => (
                    <RefereeCard key={referee.id} referee={referee} isAdmin={isAdmin} onEdit={setEditingReferee} />
                ))}
            </Stack>

            <RefereeForm
                opened={modalOpened || !!editingReferee}
                onClose={handleCloseModal}
                editingReferee={editingReferee}
            />
        </div>
    );
};

type RefereeFormProps = {
    opened: boolean;
    onClose: () => void;
    editingReferee: Referee | null;
};

const RefereeForm: FC<RefereeFormProps> = ({ opened, onClose, editingReferee }) => {
    const { addReferee, updateReferee, isAdding, isUpdating } = useRefereeMutation();
    const { data: cities } = useCitiesQuery();
    const isEditing = !!editingReferee;
    const isSaving = isAdding || isUpdating;

    const form = useForm({
        initialValues: {
            fio: "",
            license: "",
            stageYears: 0,
            cityId: null as number | null,
        },
        validate: {
            fio: (value) => (value.trim().length === 0 ? "Введите ФИО судьи" : null),
            license: (value) => (value.trim().length === 0 ? "Введите номер лицензии" : null),
            stageYears: (value) => (value < 0 ? "Стаж не может быть отрицательным" : null),
            cityId: (value) => (!value ? "Выберите город" : null),
        },
    });

    useEffect(() => {
        if (editingReferee && opened) {
            form.setValues({
                fio: editingReferee.fio,
                license: editingReferee.license,
                stageYears: editingReferee.stageYears,
                cityId: editingReferee.city?.id || null,
            });
        } else if (!opened) {
            form.reset();
        }
    }, [editingReferee, opened]);

    const handleSubmit = async (values: typeof form.values) => {
        const cityId = typeof values.cityId === "string" ? parseInt(values.cityId) : values.cityId;
        const selectedCity = cities?.find((city) => city.id === cityId);
        if (!selectedCity) {
            form.setFieldError("cityId", "Город не найден");
            return;
        }

        const refereeData = {
            fio: values.fio,
            license: values.license,
            stageYears: values.stageYears,
            city: selectedCity,
        };

        if (isEditing && editingReferee) {
            updateReferee({id: editingReferee.id, ...refereeData});
        } else {
            addReferee(refereeData);
        }
        form.reset();
        onClose();
    };

    const cityOptions = cities?.map((city: City) => ({
        value: city.id.toString(),
        label: `${city.name} (${city.country})`,
    })) || [];

    return (
        <Modal opened={opened} onClose={onClose} title={isEditing ? "Редактировать судью" : "Добавить судью"} size="lg" centered>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <TextInput label="ФИО судьи" placeholder="Иванов Иван Иванович" {...form.getInputProps("fio")} required />
                    <TextInput label="Номер лицензии" placeholder="Введите номер лицензии" {...form.getInputProps("license")} required />
                    <NumberInput label="Стаж работы (лет)" min={0} {...form.getInputProps("stageYears")} required />
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

type RefereeCardProps = {
    referee: Referee;
    isAdmin: boolean;
    onEdit: (referee: Referee) => void;
};

const RefereeCard: FC<RefereeCardProps> = ({ referee, isAdmin, onEdit }) => {
    const { deleteReferee, isDeleting } = useRefereeMutation();

    function getYearsWord(years: number): string {
        const lastDigit = years % 10;
        const lastTwoDigits = years % 100;
        if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return "лет";
        if (lastDigit === 1) return "год";
        if (lastDigit >= 2 && lastDigit <= 4) return "года";
        return "лет";
    }

    return (
        <Card withBorder padding="lg" radius="md">
            <CardSection inheritPadding py="xs">
                <Group justify="space-between">
                    <Text fw={500} size="lg">{referee.fio}</Text>
                </Group>
            </CardSection>
            <CardSection inheritPadding py="xs">
                <Stack gap="xs">
                    <Text size="sm"><strong>Лицензия:</strong> {referee.license}</Text>
                    <Text size="sm"><strong>Стаж:</strong> {referee.stageYears} {getYearsWord(referee.stageYears)}</Text>
                    <Text size="sm"><strong>Город:</strong> {referee.city?.name} ({referee.city?.country})</Text>
                </Stack>
            </CardSection>
            {isAdmin && (
                <Group justify="flex-end" mt="md">
                    <Button variant="light" onClick={() => onEdit(referee)}>Редактировать</Button>
                    <Button onClick={() => deleteReferee(referee.id)} loading={isDeleting}>Удалить</Button>
                </Group>
            )}
        </Card>
    );
};

export default Referees;