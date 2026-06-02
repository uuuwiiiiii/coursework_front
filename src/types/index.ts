export interface City {
	id: number;
	name: string;
	country: string;
}

export interface Team {
	id: number;
	city: City;
	name: string;
	peoplesInTeam: number;
	numOfWin: number;
	team?: Team;
}

export interface Referee {
	id: number;
	city: City;
	fio: string;
	license: string;
	stageYears: number;
}

export interface Match {
	id: number;
	teamGuest: Team;
	teamHost: Team;
	referee: Referee;
	city: City;
	stageType: number;
	phaseType: number;
	guestCount: number;
	hostCount: number;
	dateTime: string;
}

export interface MatchStage {
	value: number;
	stage: string;
}

export interface MatchPhase {
	value: number;
	phase: string;
}
