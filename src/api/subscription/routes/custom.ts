export default {
    routes: [
      {
        method: 'POST',
        path: '/subscription/prod',
        handler: 'api::subscription.subscription.createProd'
      },
      {
        method: 'POST',
        path: '/subscription/sandbox',
        handler: 'api::subscription.subscription.createSandbox'
      }
    ]
  };