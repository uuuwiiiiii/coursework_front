import { createFileRoute } from '@tanstack/react-router';
import { Container } from '@mantine/core';
import { useMatchesQuery } from '../hooks/useMatches';
import Bracket from '../components/Bracket';

export const Route = createFileRoute('/')({
    component: IndexPage,
});

function IndexPage() {
    const { data: matches } = useMatchesQuery();

    return (
        <Container size="xl" p="md">
            <h1>🏀 Баскетбольный чемпионат</h1>
            <p style={{ color: '#666', marginBottom: '20px' }}>
                Турнирная сетка плей-офф
            </p>
            <Bracket matches={matches || []} />
        </Container>
    );
}
