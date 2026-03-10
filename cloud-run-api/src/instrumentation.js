/**
 * OpenTelemetry auto-instrumentation for LMDR Cloud Run API.
 *
 * Sends metrics + traces via OTLP to the sidecar collector at localhost:4317,
 * which handles GCP resource detection, batching, and export to
 * Cloud Monitoring (Managed Prometheus) and Cloud Trace.
 *
 * Loaded as the first import in server.js.
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

const OTEL_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317';

const sdk = new NodeSDK({
  // Traces → OTLP gRPC → collector sidecar
  traceExporter: new OTLPTraceExporter({ url: OTEL_ENDPOINT }),

  // Metrics → OTLP gRPC → collector sidecar → Managed Prometheus
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({ url: OTEL_ENDPOINT }),
    exportIntervalMillis: 30_000,
  }),

  // Auto-instrument HTTP, Express, pg, etc.
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
      '@opentelemetry/instrumentation-dns': { enabled: false },
    }),
  ],

  // GCP resource detection is handled by the collector sidecar's
  // resourcedetection processor — no need for GcpDetectorSync here
});

sdk.start();
console.log('[otel] OpenTelemetry instrumentation started →', OTEL_ENDPOINT);

// Graceful flush on shutdown
const shutdown = async () => {
  await sdk.shutdown();
  console.log('[otel] OpenTelemetry shut down');
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
