import {queryOptions, useSuspenseQuery} from "@tanstack/react-query";
import axios from "axios";
import type { Referee} from "../types";

export const refereesQueryOptions = queryOptions({
    queryKey: ["referees"],
    queryFn: async () => {
        const {data} = await axios.get<Referee[]>(
            'api/referees'
        )
        return data;
    },
    staleTime: Infinity,
})

export const useRefereesQuery = () => {
    return useSuspenseQuery(refereesQueryOptions);
};