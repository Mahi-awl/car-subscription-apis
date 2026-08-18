export const getPagination = (query) => {


  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const getPaginationResult = (totalDocuments, page, limit) => {
  const totalPages = Math.ceil(totalDocuments / limit);

  return {
    totalDocuments,
    totalPages,
    currentPage: page,
    limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};