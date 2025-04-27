/**
 * Formats the reading time in minutes
 * @param minutes Time in minutes
 */
export const formatReadTime = (minutes: number): string => {
  if (!minutes) return '0 min';

  if (minutes < 1) {
    return '< 1 min';
  }

  return `${Math.round(minutes)} min`;
};

/**
 * Formats the publish date in relative time (e.g., "2 days ago")
 * @param dateString The ISO date string or Date object
 */
export const formatRelativeTime = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  let counter;
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    counter = Math.floor(diffInSeconds / secondsInUnit);

    if (counter > 0) {
      if (counter === 1) {
        return `1 ${unit} ago`;
      } else {
        return `${counter} ${unit}s ago`;
      }
    }
  }

  return 'just now';
};

/**
 * Truncates text to a specified length and adds ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Formats a date string into a readable format
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMS = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMS / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    // Today
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

    return `Today at ${formattedHours}:${formattedMinutes} ${ampm}`;
  } else if (diffInDays === 1) {
    // Yesterday
    return 'Yesterday';
  } else if (diffInDays < 7) {
    // Within a week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  } else if (diffInDays < 365) {
    // Within a year
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  } else {
    // More than a year ago
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  }
};

/**
 * Formats a reading time in minutes
 */
export const formatReadingTime = (minutes: number): string => {
  if (minutes < 1) {
    return 'Less than 1 min';
  } else if (minutes === 1) {
    return '1 min';
  } else {
    return `${Math.round(minutes)} min`;
  }
};
