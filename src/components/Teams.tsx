import {type FC} from 'react';
import type {Team} from '../types';
import {Card, CardSection} from "@mantine/core";
import {useTeamsQuery} from "../hooks/useTeams.tsx";

const Teams=() => {
    const {data} = useTeamsQuery();
    return (
        <div>
            <h1>Команды</h1>
            {data.map((team) => (
                <Team team={team}/>
            ))}
        </div>
    );
};

type TeamProps = {
    team: Team
}

const Team: FC<TeamProps> = ({team}) => {
    return (
        <Card withBorder>
            <CardSection>
                Команда {team.name}
            </CardSection>
        </Card>
    );
}

export default Teams;