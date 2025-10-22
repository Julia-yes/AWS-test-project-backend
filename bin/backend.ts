import * as cdk from 'aws-cdk-lib';
import { BackendStack } from "../lib/product-service/backend-stack";
import { ImportServiceStack } from "../lib/import-service/import-service-stack";
import { DatabaseStack } from "../lib/database-service/database-stack";
import { AuthorizationServiceStack } from "../lib/authorization-service/authorization-service-stack";

const app = new cdk.App();
new BackendStack(app, "BackendStack", {});
new DatabaseStack(app, 'DatabaseStack', {});
new ImportServiceStack(app, "ImportServiceStack", {});
new AuthorizationServiceStack(app, "AuthorizationServiceStack", {});
