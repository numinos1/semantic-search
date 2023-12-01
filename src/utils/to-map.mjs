/**
 * List to Map
 */
export default function toMap(list) {
  return list.reduce((map, row) =>
    map.set(row.id, row),
    new Map()
  );
}
