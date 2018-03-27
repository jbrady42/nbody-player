import QueryString from "querystring";

const endpoint = "http://localhost:9090/"
const file = "run_20.out"

export function getSnapshots(offset, count) {
  const opts = {
    name: file,
    start: offset,
    count
  }

  const qs = `?${QueryString.stringify(opts)}`

  const handleErrors = (response) => {
  if (!response.ok) {
    const err = new  Error(response.statusText);
    err.response = response
    throw err;
  }
  return response;
}

  return fetch(endpoint + qs)
  .then(handleErrors)
  .then((resp) => {
    return resp.json()
  })
}
