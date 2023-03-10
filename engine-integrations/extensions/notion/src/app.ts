/** Copyright (c) 2023, Poozle, all rights reserved. **/

import { createServer } from 'http';

import { createYoga } from 'graphql-yoga';

import ExtensionClass from './index';

const port = 8000;

async function runGateway() {
  const Class = new ExtensionClass();
  const schema = await Class.schema();

  const yoga = createYoga({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schema: schema as any,
    graphiql: false,
    landingPage: false,
    maskedErrors: false,
    context: async ({ request }: { request: Request }) => {
      const config64 = request.headers.get('config') ?? null;
      if (config64) {
        const buff = new Buffer(config64, 'base64');
        const config = buff.toString('utf8');
        return {
          config: JSON.parse(JSON.parse(config)),
        };
      }

      return {};
    },
  });

  const server = createServer(yoga);
  server.listen(port, () => {
    console.info(`Server is running on ${port}`);
  });
}

runGateway();
