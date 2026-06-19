function getMonthEnd(date = new Date()) {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    1,
    0,
    0,
    0,
    0
  ) - 1);
}

function getMonthEndIso(date = new Date()) {
  return getMonthEnd(date).toISOString();
}

function getNextMonthStart(date = new Date()) {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    1,
    0,
    0,
    0,
    0
  ));
}

function getNextMonthEnd(date = new Date()) {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth() + 2,
    1,
    0,
    0,
    0,
    0
  ) - 1);
}

function getMembershipPeriod(period = 'current', date = new Date()) {
  if (period === 'next') {
    return {
      starts: getNextMonthStart(date).toISOString(),
      expires: getNextMonthEnd(date).toISOString(),
      period: 'next',
    };
  }

  return {
    starts: date.toISOString(),
    expires: getMonthEndIso(date),
    period: 'current',
  };
}

function isLastWeekOfMonth(date = new Date()) {
  const monthEnd = getMonthEnd(date);
  const daysLeft = Math.ceil((monthEnd - date) / (1000 * 60 * 60 * 24));
  return daysLeft >= 0 && daysLeft <= 7;
}

module.exports = { getMonthEnd, getMonthEndIso, getNextMonthStart, getNextMonthEnd, getMembershipPeriod, isLastWeekOfMonth };
