export const getClientAIContext = () => ({
  localTime: new Date().toISOString(),
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
});

export const getClientLocalTimeParts = () => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
      month: '2-digit',
      timeZone: timezone,
      year: 'numeric',
    })
      .formatToParts(new Date())
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: `${parts.year}-${parts.month}-${parts.day}T${parts.hour}`,
    timezone,
  };
};
