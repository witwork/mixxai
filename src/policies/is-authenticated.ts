/**
 * `is-authenticated` policy
 */

export default (policyContext, config, { strapi }) => {
  if (policyContext.state.user) {
    // Go to next policy or controller
    return true;
  }

  return false;
}; 