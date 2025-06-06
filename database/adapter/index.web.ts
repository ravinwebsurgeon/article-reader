import LokiJSAdapter from "@nozbe/watermelondb/adapters/lokijs";
import { SchemaMigrations } from "@nozbe/watermelondb/Schema/migrations";
import { AppSchema } from "@nozbe/watermelondb";

export function getAdapter(schema: AppSchema, migrations: SchemaMigrations) {
  return new LokiJSAdapter({
    schema,
    migrations,
    useWebWorker: false,
    useIncrementalIndexedDB: true,
    onQuotaExceededError: (error) => {},
    onSetUpError: (error) => {},
    extraIncrementalIDBOptions: {
      onDidOverwrite: () => {},
      onversionchange: () => {
        window.location.reload();
      },
    },
  });
}
