export interface DataCardProps {
    title: string;
    icon?: string;
    children: React.ReactNode
}

export interface EmptySectionProps {
    title: string;
    icon?: string;
    emptyMessage?: string
}

export interface ErrorSectionProps {
    title: string;
    icon?: string;
    errorMessage?: string
}

export interface PluginDataCardProps {
    title: string;
    data: Record<string, unknown>; icon?: string
}

export type Entity = {
    identifier: string;
    blueprint?: string;
    title: string;
    icon: string;
    team: string;
    properties: Record<string, any>;
    relations: Record<string, any>;
    updatedAt?: string;
    createdAt?: string;
}

export type Params = {
    [key: string]: {
        type: string;
        value: any;
    };
}