/**
 * ai-model router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::ai-model.ai-model', {
    config: {
        find: {
          auth: false
        }
    }
});
