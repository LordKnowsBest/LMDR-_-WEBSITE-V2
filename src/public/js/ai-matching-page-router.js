export async function routeAiMatchingAction(action, payload, handlers) {
  const handler = handlers[action];
  if (typeof handler === 'function') {
    return await handler(payload);
  }

  if (typeof handlers.default === 'function') {
    return await handlers.default(payload, action);
  }

  return undefined;
}
