import { type FC } from 'react';
import type { City } from "../types";
import { Card, CardSection, Text, Group, Badge, Stack } from "@mantine/core";
import { useCitiesQuery } from "../hooks/useCities";

const Cities = () => {
    const { data: cities } = useCitiesQuery();

    return (
        <div>
            <h1>Города</h1>
            <Stack gap="md">
                {cities?.map((city) => (
                    <City key={city.id} city={city} />
                ))}
            </Stack>
        </div>
    );
};

type CityProps = {
    city: City;
};

const City: FC<CityProps> = ({ city }) => {
    return (
        <Card withBorder padding="lg" radius="md">
            <CardSection inheritPadding py="xs">
                <Group justify="space-between">
                    <Text fw={500} size="lg">{city.name}</Text>
                    <Badge color="blue" variant="light">
                        ID: {city.id}
                    </Badge>
                </Group>
            </CardSection>
            <CardSection inheritPadding py="xs">
                <Text size="sm" c="dimmed">
                    Страна: {city.country}
                </Text>
            </CardSection>
        </Card>
    );
};

export default Cities;