/**
 * report-message router
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/report-messages',
      handler: 'report-message.create',
      config: {
        policies: ['global::is-authenticated']
      }
    },
    {
      method: 'GET',
      path: '/report-messages/me',
      handler: 'report-message.findMyReports',
      config: {
        policies: ['global::is-authenticated']
      }
    }
  ]
};
