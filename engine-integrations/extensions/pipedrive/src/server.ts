/** Copyright (c) 2023, Poozle, all rights reserved. **/

import { runGateway } from '@poozle/engine-edk';

import PipedriveExtensionClass from './index';

runGateway(PipedriveExtensionClass, 8000, {
  graphiql: false,
});
