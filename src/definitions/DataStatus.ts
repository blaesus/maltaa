export interface DataStatus {
    appliedMigrations: {
        [key in string]: number
    }
}
