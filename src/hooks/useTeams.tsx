import {queryOptions, useSuspenseQuery} from "@tanstack/react-query";
import type { Team} from "../types";
import axios from "axios";

export const teamsQueryOptions = queryOptions({
    queryKey: ["teams"],
    queryFn: async () => {
        const {data} = await axios.get<Team[]>(
            'api/teams'
        )
        return data;
    },
    staleTime: Infinity,
})

export const useTeamsQuery = () => {
    return useSuspenseQuery(teamsQueryOptions);
};