import {
	queryOptions,
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import axios from "axios";
import type { Match } from "../types";

export const matchesQueryOptions = queryOptions({
	queryKey: ["matches"],
	queryFn: async () => {
		const { data } = await axios.get<Match[]>("api/matches");
		return data;
	},
	staleTime: Infinity,
});

export const useMatchesQuery = () => {
	return useSuspenseQuery(matchesQueryOptions);
};

export const useMatchMutation = () => {
	const queryClient = useQueryClient();

	const deleteMatch = useMutation({
		mutationFn: async (id: number) => {
			const { data } = await axios.delete(`api/matches/${id}`);
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: matchesQueryOptions.queryKey });
		},
	});

	const addMatch = useMutation({
		mutationFn: async (newMatch: Omit<Match, "id">) => {
			const { data } = await axios.post<Match>("api/matches", newMatch);
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: matchesQueryOptions.queryKey });
		},
	});

	return {
		deleteMatch: deleteMatch.mutate,
		isDeleting: deleteMatch.isPending,
		deleteError: deleteMatch.error,
		addMatch: addMatch.mutate,
		isAdding: addMatch.isPending,
		addError: addMatch.error,
	};
};
