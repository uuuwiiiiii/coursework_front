import {
	queryOptions,
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import type { City } from "../types";
import axios from "axios";

export const citiesQueryOptions = queryOptions({
	queryKey: ["cities"],
	queryFn: async () => {
		const { data } = await axios.get<City[]>("api/cities");
		return data;
	},
	staleTime: Infinity,
});

export const useCitiesQuery = () => {
	return useSuspenseQuery(citiesQueryOptions);
};

export const useCityMutation = () => {
    const queryClient = useQueryClient();

    const deleteCity = useMutation({
        mutationFn: async (id: number) => {
            const { data } = await axios.delete(`api/cities/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: citiesQueryOptions.queryKey });
        },
    });

    const addCity = useMutation({
        mutationFn: async (newCity: { name: string; country: string }) => {
            const { data } = await axios.post<City>("api/cities", newCity);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: citiesQueryOptions.queryKey });
        },
    });

    const updateCity = useMutation({
        mutationFn: async (city: City) => {
            const { data } = await axios.put<City>("api/cities", city);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: citiesQueryOptions.queryKey });
        },
    });

    return {
        deleteCity: deleteCity.mutate,
        isDeleting: deleteCity.isPending,
        deleteError: deleteCity.error,
        addCity: addCity.mutate,
        isAdding: addCity.isPending,
        addError: addCity.error,
        updateCity: updateCity.mutate,
        isUpdating: updateCity.isPending,
        updateError: updateCity.error,
    };
};
