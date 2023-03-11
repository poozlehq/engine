import { useOpenTelemetry } from '@envelop/opentelemetry';
import {
  BasicTracerProvider,
  SimpleSpanProcessor,
} from '@opentelemetry/tracing';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const exporter = new OTLPTraceExporter({
  url: process.env.OPEN_TELEMETRY_URL
});

const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: process.env.WORKSPACE_ID,
}) as any;

const provider = new BasicTracerProvider({ resource });
provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.register();

export default [
  useOpenTelemetry(
    {
      resolvers: true,
      variables: true,
      result: true,
    },
    provider,
  ),
];
