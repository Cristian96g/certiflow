export const formatDateTime = (date, time) => {
  if (!date) return "-";
  return `${date}${time ? ` ${time}` : ""}`;
};

export const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return value;
  }

  return parsed.toFixed(2);
};
