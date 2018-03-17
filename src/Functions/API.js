import { connect } from "react-refetch";
import urlJoin from "url-join";
const baseUrl = "https://functions.carlyzach.com";
const apiConnector = connect.defaults({
  buildRequest: function(mapping) {
    mapping.method = "POST";
    mapping.force = true;
    if (typeof mapping.body === "object" && mapping.body) {
      mapping.body = JSON.stringify(mapping.body);
    }
    return new Request(urlJoin(baseUrl, mapping.url), mapping);
  },
  handleResponse: function(response) {
    if (
      response.headers.get("content-length") === "0" ||
      response.status === 204
    ) {
      return;
    }

    // handle the fact that some functions return text and some return json
    const t = response.text();
    if (response.status >= 200 && response.status < 300) {
      return t.then(
        text =>
          new Promise((resolve, reject) => {
            try {
              if ((text.length > 1 && text[0] === "{") || text[0] === "[") {
                resolve(JSON.parse(text));
                return;
              }
            } catch (e) {
              reject(e);
              return;
            }
            resolve(text);
          })
      );
    } else {
      return t.then(cause => Promise.reject(new Error(cause)));
    }
  }
});

export default apiConnector;
