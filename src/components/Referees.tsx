import {type FC, useEffect, useState} from "react";
import {exportRefereesToCSV} from "../hooks/useExport";
import type {City, Referee} from "../types";
import {Button, Card, CardSection, Group, Modal, NumberInput, Select, Stack, Text, TextInput,} from "@mantine/core";
import {useForm} from "@mantine/form";
import {useRefereeMutation, useRefereesQuery} from "../hooks/useReferees";
import {useCitiesQuery} from "../hooks/useCities";
import {useAuth} from "../context/AuthContext";
import "@mantine/core/styles.css";

const Referees = () => {
    const {data: referees} = useRefereesQuery();
    const [modalOpened, setModalOpened] = useState(false);
    const [editingReferee, setEditingReferee] = useState<Referee | null>(null);
    const {isAuthenticated, isAdmin} = useAuth();

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
                    <RefereeCard key={referee.id} referee={referee} isAdmin={isAdmin} onEdit={setEditingReferee}/>
                ))}
            </Stack>

            {isAdmin && (
                <RefereeForm opened={modalOpened} onClose={() => setModalOpened(false)}/>
            )}

            <RefereeEditForm
                opened={!!editingReferee}
                onClose={() => setEditingReferee(null)}
                referee={editingReferee}
            />
        </div>
    );
};

type RefereeFormProps = {
    opened: boolean;
    onClose: () => void;
};

const RefereeForm: FC<RefereeFormProps> = ({opened, onClose}) => {
    const {addReferee, isAdding} = useRefereeMutation();
    const {data: cities} = useCitiesQuery();
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

        await addReferee(refereeData);
        form.reset();
        onClose();
    };

    const cityOptions =
        cities?.map((city: City) => ({
            value: city.id.toString(),
            label: `${city.name} (${city.country})`,
        })) || [];

    return (
        <Modal opened={opened} onClose={onClose} title="Добавить нового судью" size="lg" centered>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <TextInput label="ФИО судьи" placeholder="Иванов Иван Иванович" {...form.getInputProps("fio")}
                               required/>
                    <TextInput label="Номер лицензии"
                               placeholder="Введите номер лицензии" {...form.getInputProps("license")} required/>
                    <NumberInput label="Стаж работы (лет)" min={0} {...form.getInputProps("stageYears")} required/>
                    <Select label="Город" placeholder="Выберите город"
                            data={cityOptions} {...form.getInputProps("cityId")} required/>
                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={onClose}>Отмена</Button>
                        <Button type="submit" loading={isAdding}>Добавить судью</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

type RefereeEditFormProps = {
    opened: boolean;
    onClose: () => void;
    referee: Referee | null;
};

const RefereeEditForm: FC<RefereeEditFormProps> = ({opened, onClose, referee}) => {
    const {updateReferee, isUpdating} = useRefereeMutation();
    const {data: cities} = useCitiesQuery();
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
        if (referee && opened) {
            form.setValues({
                fio: referee.fio,
                license: referee.license,
                stageYears: referee.stageYears,
                cityId: referee.city?.id || null,
            });
        }
    }, [referee, opened]);

    const handleSubmit = async (values: typeof form.values) => {
        if (!referee) return;

        const cityId = typeof values.cityId === "string" ? parseInt(values.cityId) : values.cityId;
        const selectedCity = cities?.find((city) => city.id === cityId);
        if (!selectedCity) {
            form.setFieldError("cityId", "Город не найден");
            return;
        }

        try {
            await updateReferee({
                id: referee.id,
                fio: values.fio,
                license: values.license,
                stageYears: values.stageYears,
                city: selectedCity,
            });
            form.reset();
            onClose();
        } catch (error) {
            console.error("Ошибка при обновлении судьи:", error);
            alert("Произошла ошибка при сохранении судьи");
        }
    };

    const cityOptions =
        cities?.map((city: City) => ({
            value: city.id.toString(),
            label: `${city.name} (${city.country})`,
        })) || [];

    return (
        <Modal opened={opened} onClose={onClose} title="Редактировать судью" size="lg" centered>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <TextInput label="ФИО судьи" {...form.getInputProps("fio")} required/>
                    <TextInput label="Номер лицензии" {...form.getInputProps("license")} required/>
                    <NumberInput label="Стаж работы (лет)" min={0} {...form.getInputProps("stageYears")} required/>
                    <Select label="Город" placeholder="Выберите город"
                            data={cityOptions} {...form.getInputProps("cityId")} required/>
                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={onClose}>Отмена</Button>
                        <Button type="submit" loading={isUpdating}>Сохранить изменения</Button>
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

const RefereeCard: FC<RefereeCardProps> = ({referee, isAdmin, onEdit}) => {
    const {deleteReferee, isDeleting} = useRefereeMutation();
    const handleDelete = () => {
        if (confirm(`Удалить судью ${referee.fio}?`)) {
            deleteReferee(referee.id);
        }
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
                    <Text size="sm"><strong>Стаж:</strong> {referee.stageYears} {getYearsWord(referee.stageYears)}
                    </Text>
                    <Text size="sm"><strong>Город:</strong> {referee.city?.name} ({referee.city?.country})</Text>
                </Stack>
            </CardSection>
            {isAdmin && (
                <Group justify="flex-end" mt="md">
                    <Button variant="light" onClick={() => onEdit(referee)}>Редактировать</Button>
                    <Button onClick={handleDelete} loading={isDeleting}>Удалить</Button>
                </Group>
            )}
        </Card>
    );
};

export default Referees;