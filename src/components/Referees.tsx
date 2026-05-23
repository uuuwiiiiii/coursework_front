import {type FC} from 'react';
import type {Referee} from "../types";
import {Card, CardSection, Stack} from "@mantine/core";
import {useRefereesQuery} from "../hooks/useReferees.tsx";

const Referees=() => {
    const {data} = useRefereesQuery();

    return (
        <div>
            <h1>Судьи</h1>
            <Stack gap="md">
                {data.map((referee) => (
                    <Referee key={referee.id} referee={referee}/>
                ))}
            </Stack>
        </div>
    );
};

type RefereeProps = {
    referee: Referee
}

const Referee: FC<RefereeProps> = ({referee}) => {
    return (
        <Card withBorder>
            <CardSection>
                Судья {referee.fio}
            </CardSection>
        </Card>
    );
}

export default Referees;