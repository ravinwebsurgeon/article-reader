import LokiJSAdapter from "@nozbe/watermelondb/adapters/lokijs";

export function getAdapter(schema, migrations) {
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
