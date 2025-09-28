
import 'source-map-support/register.js';
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from './database/database-stack.js';
const app = new cdk.App();

new DatabaseStack(app, 'DatabaseStack');