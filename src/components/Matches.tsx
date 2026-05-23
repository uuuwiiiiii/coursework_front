import type {Match} from "../types";
import {Card, CardSection, Stack} from "@mantine/core";
import {useMatchesQuery} from "../hooks/useMathces.tsx";
import type {FC} from "react";

const Matches = () => {
    const {data} = useMatchesQuery();

    return (
        <div>
            <h1>Матчи</h1>
            <Stack gap="md">
                {data.map((match) => (
                    <Match key={match.id} match={match}/>
                ))}
            </Stack>
        </div>
    );
};

type MatchProps = {
    match: Match
}

const Match: FC<MatchProps> = ({match}) => {
    return (
        <Card withBorder>
            <CardSection>
                Матч {match.teamGuest.name} - {match.teamHost.name}
            </CardSection>
        </Card>
    )
        ;
}

export default Matches;