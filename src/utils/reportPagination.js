export const fetchAllPages = async (loader, params, pageSize = 200) => {
  const first = await loader({ ...params, page: 0, size: pageSize })
  const firstContent = Array.isArray(first?.content) ? first.content : []
  const totalPages = Number.isFinite(first?.totalPages) ? first.totalPages : 1

  if (totalPages <= 1) return firstContent

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      loader({ ...params, page: index + 1, size: pageSize }),
    ),
  )

  return [
    ...firstContent,
    ...rest.flatMap((page) => (Array.isArray(page?.content) ? page.content : [])),
  ]
}
