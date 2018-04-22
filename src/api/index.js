import QueryString from "querystring";

export default class ApiCLient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  getSnapshots(fname, offset, count) {
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

    return fetch(this.baseUrl + qs)
    .then(handleErrors)
    .then((resp) => {
      return resp.json()
    })
  }
}
