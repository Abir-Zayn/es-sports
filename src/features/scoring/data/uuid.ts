const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ids from the database are uuids; anything else is a local or preview id. */
export const isUuid = (value: string) => UUID.test(value);
