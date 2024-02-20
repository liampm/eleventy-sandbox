const getBuildInfo = () => {
  const now = new Date();
  const timeZone = 'Europe/London';
  const buildTime = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'long',
    timeStyle: 'long',
    timeZone,
  }).format(now);
  return {
    // Can't use timeZoneName option together with dateStyle, so interpolate manually
    time: {
      raw: now.toISOString(),
      formatted: `${buildTime} ${timeZone}`,
    },
  };
};

module.exports = getBuildInfo;
