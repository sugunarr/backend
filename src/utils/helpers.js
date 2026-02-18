/**
 * Utility function to validate and parse date parameters
 */
function parseDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)');
  }
  return date;
}

/**
 * Utility function to validate pagination parameters
 */
function parsePagination(page, pageSize) {
  const defaultPageSize = 25;
  const maxPageSize = 100;

  let pageNum = parseInt(page) || 1;
  let size = parseInt(pageSize) || defaultPageSize;

  if (pageNum < 1) pageNum = 1;
  if (size < 1) size = 1;
  if (size > maxPageSize) size = maxPageSize;

  return {
    page: pageNum,
    pageSize: size,
    offset: (pageNum - 1) * size,
  };
}

/**
 * Wrap async route handlers to catch errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  parseDate,
  parsePagination,
  asyncHandler,
};
