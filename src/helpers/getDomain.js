import { isProduction } from "./isProduction"

/**
 * This helper function returns the current domain of the API.
 * If the environment is production, the production App Engine URL will be returned.
 * Otherwise, the link localhost:8080 will be returned (Spring server default port).
 * @returns {string}
 */
const getDomain = () => {
  console.log("Current NODE_ENV:", process.env.NODE_ENV); // Debug log
  const prodUrl = "https://b2gapp-g9ahbre4ejh9fufr.centralindia-01.azurewebsites.net/" // Remove trailing slash
  const devUrl = "http://localhost:8080"

  // Force development URL when running locally
  if (process.env.NODE_ENV !== "production") {

    return devUrl;
  }

  return prodUrl;
}

export { getDomain };
