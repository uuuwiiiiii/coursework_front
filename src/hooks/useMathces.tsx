import {queryOptions, useSuspenseQuery} from "@tanstack/react-query";
import axios from "axios";
import type {Match} from "../types";

export const matchesQueryOptions = queryOptions({
    queryKey: ["matches"],
    queryFn: async () => {
        const {data} = await axios.get<Match[]>(
            'api/matches'
        )
        return data;
    },
    staleTime: Infinity,
})

export const useMatchesQuery = () => {
    return useSuspenseQuery(matchesQueryOptions);
};