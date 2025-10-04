import * as cdk from 'aws-cdk-lib';
import { BackendStack } from "../lib/product-stack/backend-stack";
import { ImportServiceStack } from "../lib/import-service-stack/import-service-stack";
import { DatabaseStack } from '../lib/database-stack/database-stack';

const app = new cdk.App();
new BackendStack(app, "BackendStack", {});
new DatabaseStack(app, 'DatabaseStack', {});
new ImportServiceStack(app, "ImportServiceStack", {});
