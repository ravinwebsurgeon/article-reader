export interface Action<P = any, T = any> {
    type: T,
    payload: P,
}

export interface PaginationState {
    page: number,
    totalPages: number,
    perPage: number
}

type ISetPagination = Omit<PaginationState, "perPage">

export interface AppState {
    extra: ExtraSlice,

}

export interface ExtraSlice {
    isLoading: boolean
    loadingMessage: string
    currentLocation: ILocation | undefined
    clientBookings: any[]; 
}

export interface UserData {
    [key: string]: any
}

export interface APIResponse {
    status: number
    message?: string
    data?: any
    [key: string]: any
}


declare module 'react-redux' {
    function useSelector<TState = AppState, Selected = any>(selector: (state: TState) => Selected, equalityFn?: EqualityFn<Selected> | undefined): Selected;
}

import type { EqualityFn } from 'react-redux'
import type { SelectEffect, Tail } from 'redux-saga/effects'
declare module 'redux-saga/effects' {
    function select<Fn extends (state: AppState, ...args: any[]) => any>(
        selector: Fn,
        ...args: Tail<Parameters<Fn>>
    ): SelectEffect
}
