import {queryOptions, useSuspenseQuery} from "@tanstack/react-query";
import type {City} from "../types";
import axios from "axios";

export const citiesQueryOptions = queryOptions({
    queryKey: ["cities"],
    queryFn: async () => {
        const {data} = await axios.get<City[]>(
            'api/cities'
        )
        return data;
    },
    staleTime: Infinity,
})

export const useCitiesQuery = () => {
    return useSuspenseQuery(citiesQueryOptions);
};