// Extends app.json. `google-services.json` is gitignored: EAS builds get it from the GOOGLE_SERVICES_JSON file
// variable, local builds read the copy at the repo root.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
  },
});
