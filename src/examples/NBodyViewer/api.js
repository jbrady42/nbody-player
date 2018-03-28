import QueryString from "querystring";


export function getSnapshots(endpoint, fname, offset, count) {
  const opts = {
    name: fname,
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
