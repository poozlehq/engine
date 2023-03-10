/** Copyright (c) 2023, Poozle, all rights reserved. **/

import { makeExecutableSchema } from "@graphql-tools/schema";
import axios from "axios";
import { print, GraphQLSchema, GraphQLError } from "graphql";
import { GraphQLJSON } from "graphql-scalars";

import { typeDefs } from "./base_typeDefs";
import {
  AuthHeaderResponse,
  BaseExtensionInterface,
  CheckResponse,
  Config,
  SchemaResponse,
  SpecResponse,
} from "../types";

export class BaseGraphQLExtension implements BaseExtensionInterface {
  url: string;

  // This function is written again in the extended class
  async getSchema(): Promise<GraphQLSchema> {
    const typeDefs = /* GraphQL */ `
      type Query {
      }
    `;

    return makeExecutableSchema({
      typeDefs,
    });
  }

  // This function is written again in the extended class
  async getSpec(): SpecResponse {
    return undefined;
  }

  // This function is written again in the extended class
  // This is to used to check if the credentials are valid
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async checkCredentials(_config: Config): CheckResponse {
    return { status: false };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async authHeaders(_config: Config): AuthHeaderResponse {
    return {};
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getURL(_config: Config): Promise<string> {
    return this.url;
  }

  // This is configured for the GRAPHQL extension
  // We are using graphql-tools converter to generate GRAPHQL Schema
  async schema(): SchemaResponse {
    // This is the executor which is called everytime a request is made
    // We use this to populate the auth Headers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const remoteExecutor = async ({ document, variables, context }: any) => {
      try {
        const credentials = context.config;
        const query = print(document);
        const authHeaders = await this.authHeaders(credentials);
        const url = await this.getURL(context.config);
        const fetchResult = await axios.post(
          url,
          {
            query,
            variables,
          },
          {
            headers: {
              "Content-Type": "application/json",
              ...authHeaders,
            },
          }
        );
        return fetchResult.data;
      } catch (e) {
        return Promise.reject(new GraphQLError(e));
      }
    };

    return {
      schema: await this.getSchema(),
      executor: remoteExecutor,
    };
  }

  /**
   * Will return additionalSchema adding
   * check, authHeaders, spec
   */
  additionalSchema(): GraphQLSchema {
    const resolvers = {
      Spec: GraphQLJSON,
      Config: GraphQLJSON,
      Headers: GraphQLJSON,
      Query: {
        getSpec: async () => ({ spec: await this.spec() }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        check: async (_: any, { config }: any) => await this.check(config),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getHeaders: async (_: any, { config }: any) => ({
          headers: await this.authHeaders(config),
        }),
      },
    };

    return makeExecutableSchema({ typeDefs, resolvers });
  }

  /*
    This will return the spec for the extension
  */
  async spec(): SpecResponse {
    return this.getSpec();
  }

  /*
    This function will be used when the extension is getting configured. We will use this to test with the
    credentials are valid.
  */
  async check(config: string): CheckResponse {
    try {
      const buff = new Buffer(config, "base64");
      const configJSON = buff.toString("utf8");
      return await this.checkCredentials(JSON.parse(configJSON) as Config);
    } catch (err) {
      return {
        status: false,
        error: err.message as string,
      };
    }
  }
}
