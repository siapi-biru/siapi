import { DatabaseManager, Repository } from 'siapi-database';

interface Siapi {
  db: DatabaseManager;

  query(model: string, plugin: string): Repository;
}

export default function createSiapi(opts: any): Siapi;

declare global {
  const siapi: Siapi;
}
